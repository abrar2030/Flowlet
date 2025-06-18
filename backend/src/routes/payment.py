from flask import Blueprint, request, jsonify
from src.models.database import db, Transaction, Wallet, LedgerEntry
from datetime import datetime
import uuid
from decimal import Decimal
import random
import string

payment_bp = Blueprint('payment', __name__)

def generate_reference_id():
    """Generate a unique reference ID for payments"""
    return 'PAY_' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=12))

def create_ledger_entries(transaction, wallet):
    """Create double-entry ledger entries for a transaction"""
    try:
        if transaction.transaction_type == 'credit':
            # Debit: Cash/Bank Account, Credit: Customer Liability
            debit_entry = LedgerEntry(
                transaction_id=transaction.id,
                account_type='asset',
                account_name='Cash_and_Bank',
                debit_amount=transaction.amount,
                credit_amount=Decimal('0.00'),
                currency=transaction.currency,
                description=f"Cash received for wallet {wallet.id}"
            )
            
            credit_entry = LedgerEntry(
                transaction_id=transaction.id,
                account_type='liability',
                account_name=f'Customer_Wallet_{wallet.id}',
                debit_amount=Decimal('0.00'),
                credit_amount=transaction.amount,
                currency=transaction.currency,
                description=f"Customer wallet credit for {transaction.description}"
            )
            
        elif transaction.transaction_type == 'debit':
            # Debit: Customer Liability, Credit: Cash/Bank Account
            debit_entry = LedgerEntry(
                transaction_id=transaction.id,
                account_type='liability',
                account_name=f'Customer_Wallet_{wallet.id}',
                debit_amount=transaction.amount,
                credit_amount=Decimal('0.00'),
                currency=transaction.currency,
                description=f"Customer wallet debit for {transaction.description}"
            )
            
            credit_entry = LedgerEntry(
                transaction_id=transaction.id,
                account_type='asset',
                account_name='Cash_and_Bank',
                debit_amount=Decimal('0.00'),
                credit_amount=transaction.amount,
                currency=transaction.currency,
                description=f"Cash paid out for wallet {wallet.id}"
            )
        
        db.session.add(debit_entry)
        db.session.add(credit_entry)
        
    except Exception as e:
        raise Exception(f"Failed to create ledger entries: {str(e)}")

@payment_bp.route('/deposit', methods=['POST'])
def deposit_funds():
    """Deposit funds into a wallet"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['wallet_id', 'amount', 'payment_method', 'description']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        wallet = Wallet.query.get(data['wallet_id'])
        if not wallet:
            return jsonify({'error': 'Wallet not found'}), 404
        
        if wallet.status != 'active':
            return jsonify({'error': 'Wallet is not active'}), 400
        
        amount = Decimal(str(data['amount']))
        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400
        
        # Create deposit transaction
        transaction = Transaction(
            wallet_id=data['wallet_id'],
            transaction_type='credit',
            amount=amount,
            currency=wallet.currency,
            description=data['description'],
            reference_id=generate_reference_id(),
            status='completed',
            payment_method=data['payment_method'],
            external_transaction_id=data.get('external_transaction_id')
        )
        
        # Update wallet balance
        wallet.balance += amount
        wallet.available_balance += amount
        wallet.updated_at = datetime.utcnow()
        
        # Create ledger entries
        create_ledger_entries(transaction, wallet)
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'transaction_id': transaction.id,
            'wallet_id': wallet.id,
            'amount': str(amount),
            'currency': wallet.currency,
            'status': transaction.status,
            'reference_id': transaction.reference_id,
            'payment_method': transaction.payment_method,
            'new_balance': str(wallet.balance),
            'created_at': transaction.created_at.isoformat()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@payment_bp.route('/withdraw', methods=['POST'])
def withdraw_funds():
    """Withdraw funds from a wallet"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['wallet_id', 'amount', 'payment_method', 'description']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        wallet = Wallet.query.get(data['wallet_id'])
        if not wallet:
            return jsonify({'error': 'Wallet not found'}), 404
        
        if wallet.status != 'active':
            return jsonify({'error': 'Wallet is not active'}), 400
        
        amount = Decimal(str(data['amount']))
        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400
        
        # Check sufficient balance
        if wallet.available_balance < amount:
            return jsonify({'error': 'Insufficient balance'}), 400
        
        # Create withdrawal transaction
        transaction = Transaction(
            wallet_id=data['wallet_id'],
            transaction_type='debit',
            amount=amount,
            currency=wallet.currency,
            description=data['description'],
            reference_id=generate_reference_id(),
            status='completed',
            payment_method=data['payment_method'],
            external_transaction_id=data.get('external_transaction_id')
        )
        
        # Update wallet balance
        wallet.balance -= amount
        wallet.available_balance -= amount
        wallet.updated_at = datetime.utcnow()
        
        # Create ledger entries
        create_ledger_entries(transaction, wallet)
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'transaction_id': transaction.id,
            'wallet_id': wallet.id,
            'amount': str(amount),
            'currency': wallet.currency,
            'status': transaction.status,
            'reference_id': transaction.reference_id,
            'payment_method': transaction.payment_method,
            'new_balance': str(wallet.balance),
            'created_at': transaction.created_at.isoformat()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@payment_bp.route('/bank-transfer', methods=['POST'])
def bank_transfer():
    """Process bank transfer (ACH, SEPA, Wire)"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['wallet_id', 'amount', 'transfer_type', 'bank_details', 'description']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        wallet = Wallet.query.get(data['wallet_id'])
        if not wallet:
            return jsonify({'error': 'Wallet not found'}), 404
        
        amount = Decimal(str(data['amount']))
        transfer_type = data['transfer_type']  # ACH, SEPA, WIRE
        
        # Validate transfer type
        if transfer_type not in ['ACH', 'SEPA', 'WIRE']:
            return jsonify({'error': 'Invalid transfer type'}), 400
        
        # For outgoing transfers, check balance
        if data.get('direction', 'outgoing') == 'outgoing':
            if wallet.available_balance < amount:
                return jsonify({'error': 'Insufficient balance'}), 400
            transaction_type = 'debit'
        else:
            transaction_type = 'credit'
        
        # Create bank transfer transaction
        transaction = Transaction(
            wallet_id=data['wallet_id'],
            transaction_type=transaction_type,
            amount=amount,
            currency=wallet.currency,
            description=f"{transfer_type} Transfer: {data['description']}",
            reference_id=generate_reference_id(),
            status='pending',  # Bank transfers typically start as pending
            payment_method=f'bank_transfer_{transfer_type.lower()}',
            external_transaction_id=data.get('external_transaction_id')
        )
        
        # Update wallet balance for outgoing transfers
        if transaction_type == 'debit':
            wallet.available_balance -= amount  # Reserve funds
        
        wallet.updated_at = datetime.utcnow()
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'transaction_id': transaction.id,
            'wallet_id': wallet.id,
            'amount': str(amount),
            'currency': wallet.currency,
            'transfer_type': transfer_type,
            'status': transaction.status,
            'reference_id': transaction.reference_id,
            'estimated_completion': '1-3 business days',
            'created_at': transaction.created_at.isoformat()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@payment_bp.route('/card-payment', methods=['POST'])
def process_card_payment():
    """Process card payment"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['wallet_id', 'amount', 'card_token', 'merchant_info', 'description']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        wallet = Wallet.query.get(data['wallet_id'])
        if not wallet:
            return jsonify({'error': 'Wallet not found'}), 404
        
        amount = Decimal(str(data['amount']))
        
        # Check sufficient balance
        if wallet.available_balance < amount:
            return jsonify({'error': 'Insufficient balance'}), 400
        
        # Simulate card payment processing
        payment_status = 'completed' if random.random() > 0.05 else 'failed'  # 95% success rate
        
        # Create card payment transaction
        transaction = Transaction(
            wallet_id=data['wallet_id'],
            transaction_type='debit',
            amount=amount,
            currency=wallet.currency,
            description=f"Card Payment: {data['description']}",
            reference_id=generate_reference_id(),
            status=payment_status,
            payment_method='card_payment',
            external_transaction_id=data.get('external_transaction_id')
        )
        
        # Update wallet balance only if payment successful
        if payment_status == 'completed':
            wallet.balance -= amount
            wallet.available_balance -= amount
            create_ledger_entries(transaction, wallet)
        
        wallet.updated_at = datetime.utcnow()
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'transaction_id': transaction.id,
            'wallet_id': wallet.id,
            'amount': str(amount),
            'currency': wallet.currency,
            'status': payment_status,
            'reference_id': transaction.reference_id,
            'merchant_info': data['merchant_info'],
            'new_balance': str(wallet.balance) if payment_status == 'completed' else str(wallet.balance),
            'created_at': transaction.created_at.isoformat()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@payment_bp.route('/transaction/<transaction_id>', methods=['GET'])
def get_transaction(transaction_id):
    """Get transaction details"""
    try:
        transaction = Transaction.query.get(transaction_id)
        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404
        
        return jsonify({
            'transaction_id': transaction.id,
            'wallet_id': transaction.wallet_id,
            'type': transaction.transaction_type,
            'amount': str(transaction.amount),
            'currency': transaction.currency,
            'description': transaction.description,
            'status': transaction.status,
            'payment_method': transaction.payment_method,
            'reference_id': transaction.reference_id,
            'external_transaction_id': transaction.external_transaction_id,
            'created_at': transaction.created_at.isoformat(),
            'updated_at': transaction.updated_at.isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payment_bp.route('/transaction/<transaction_id>/status', methods=['PUT'])
def update_transaction_status(transaction_id):
    """Update transaction status (for external system callbacks)"""
    try:
        data = request.get_json()
        
        if 'status' not in data:
            return jsonify({'error': 'Missing required field: status'}), 400
        
        transaction = Transaction.query.get(transaction_id)
        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404
        
        old_status = transaction.status
        new_status = data['status']
        
        # Validate status transition
        valid_statuses = ['pending', 'completed', 'failed', 'cancelled']
        if new_status not in valid_statuses:
            return jsonify({'error': 'Invalid status'}), 400
        
        transaction.status = new_status
        transaction.updated_at = datetime.utcnow()
        
        # Handle status changes that affect wallet balance
        wallet = Wallet.query.get(transaction.wallet_id)
        
        if old_status == 'pending' and new_status == 'completed':
            # Complete a pending transaction
            if transaction.transaction_type == 'credit':
                wallet.balance += transaction.amount
                wallet.available_balance += transaction.amount
                create_ledger_entries(transaction, wallet)
            elif transaction.transaction_type == 'debit':
                wallet.balance -= transaction.amount
                # available_balance was already reduced when transaction was created
                create_ledger_entries(transaction, wallet)
                
        elif old_status == 'pending' and new_status == 'failed':
            # Failed transaction - restore available balance for debits
            if transaction.transaction_type == 'debit':
                wallet.available_balance += transaction.amount
        
        wallet.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'transaction_id': transaction.id,
            'old_status': old_status,
            'new_status': new_status,
            'updated_at': transaction.updated_at.isoformat()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@payment_bp.route('/exchange-rate/<from_currency>/<to_currency>', methods=['GET'])
def get_exchange_rate(from_currency, to_currency):
    """Get exchange rate between currencies (mock implementation)"""
    try:
        # Mock exchange rates - in production, this would call a real exchange rate API
        mock_rates = {
            'USD': {'EUR': 0.85, 'GBP': 0.73, 'JPY': 110.0, 'CAD': 1.25},
            'EUR': {'USD': 1.18, 'GBP': 0.86, 'JPY': 129.0, 'CAD': 1.47},
            'GBP': {'USD': 1.37, 'EUR': 1.16, 'JPY': 150.0, 'CAD': 1.71}
        }
        
        if from_currency == to_currency:
            rate = 1.0
        elif from_currency in mock_rates and to_currency in mock_rates[from_currency]:
            rate = mock_rates[from_currency][to_currency]
        else:
            return jsonify({'error': 'Exchange rate not available'}), 404
        
        return jsonify({
            'from_currency': from_currency,
            'to_currency': to_currency,
            'exchange_rate': rate,
            'timestamp': datetime.utcnow().isoformat(),
            'provider': 'Flowlet Exchange Service'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payment_bp.route('/currency-conversion', methods=['POST'])
def currency_conversion():
    """Convert amount between currencies"""
    try:
        data = request.get_json()
        
        required_fields = ['from_wallet_id', 'to_wallet_id', 'amount']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        from_wallet = Wallet.query.get(data['from_wallet_id'])
        to_wallet = Wallet.query.get(data['to_wallet_id'])
        
        if not from_wallet or not to_wallet:
            return jsonify({'error': 'One or both wallets not found'}), 404
        
        amount = Decimal(str(data['amount']))
        
        # Get exchange rate
        rate_response = get_exchange_rate(from_wallet.currency, to_wallet.currency)
        if rate_response[1] != 200:
            return rate_response
        
        rate_data = rate_response[0].get_json()
        exchange_rate = Decimal(str(rate_data['exchange_rate']))
        converted_amount = amount * exchange_rate
        
        # Check sufficient balance
        if from_wallet.available_balance < amount:
            return jsonify({'error': 'Insufficient balance'}), 400
        
        # Create conversion transactions
        debit_transaction = Transaction(
            wallet_id=from_wallet.id,
            transaction_type='debit',
            amount=amount,
            currency=from_wallet.currency,
            description=f"Currency conversion to {to_wallet.currency}",
            reference_id=generate_reference_id(),
            status='completed',
            payment_method='currency_conversion'
        )
        
        credit_transaction = Transaction(
            wallet_id=to_wallet.id,
            transaction_type='credit',
            amount=converted_amount,
            currency=to_wallet.currency,
            description=f"Currency conversion from {from_wallet.currency}",
            reference_id=debit_transaction.reference_id,
            status='completed',
            payment_method='currency_conversion'
        )
        
        # Update wallet balances
        from_wallet.balance -= amount
        from_wallet.available_balance -= amount
        to_wallet.balance += converted_amount
        to_wallet.available_balance += converted_amount
        
        # Update timestamps
        from_wallet.updated_at = datetime.utcnow()
        to_wallet.updated_at = datetime.utcnow()
        
        # Create ledger entries
        create_ledger_entries(debit_transaction, from_wallet)
        create_ledger_entries(credit_transaction, to_wallet)
        
        db.session.add(debit_transaction)
        db.session.add(credit_transaction)
        db.session.commit()
        
        return jsonify({
            'conversion_id': debit_transaction.reference_id,
            'from_wallet_id': from_wallet.id,
            'to_wallet_id': to_wallet.id,
            'original_amount': str(amount),
            'original_currency': from_wallet.currency,
            'converted_amount': str(converted_amount),
            'converted_currency': to_wallet.currency,
            'exchange_rate': str(exchange_rate),
            'status': 'completed',
            'created_at': debit_transaction.created_at.isoformat()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


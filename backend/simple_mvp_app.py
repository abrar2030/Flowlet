"""
Simple Flask app to test MVP functionality without complex imports
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import uuid
import json
from datetime import datetime
from decimal import Decimal

app = Flask(__name__)
CORS(app)

# Database setup
DATABASE = 'flowlet_mvp.db'

def init_db():
    """Initialize the database with required tables"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            first_name TEXT,
            last_name TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Accounts table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS accounts (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            account_name TEXT,
            account_number TEXT UNIQUE,
            account_type TEXT,
            currency TEXT DEFAULT 'USD',
            available_balance INTEGER DEFAULT 0,
            current_balance INTEGER DEFAULT 0,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Transactions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            transaction_id TEXT UNIQUE,
            user_id TEXT,
            account_id TEXT,
            transaction_type TEXT,
            transaction_category TEXT,
            amount_cents INTEGER,
            currency TEXT,
            description TEXT,
            status TEXT DEFAULT 'completed',
            reference_number TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (account_id) REFERENCES accounts (id)
        )
    ''')
    
    conn.commit()
    conn.close()

def generate_account_number():
    """Generate a unique 16-digit account number"""
    import random
    while True:
        account_number = ''.join([str(random.randint(0, 9)) for _ in range(16)])
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute('SELECT id FROM accounts WHERE account_number = ?', (account_number,))
        if not cursor.fetchone():
            conn.close()
            return account_number
        conn.close()

def generate_transaction_id():
    """Generate a unique transaction ID"""
    import random
    import string
    date_str = datetime.now().strftime('%Y%m%d')
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    return f"TXN-{date_str}-{random_str}"

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0-mvp',
        'services': {
            'database': 'healthy',
            'api': 'active'
        }
    }), 200

@app.route('/api/v1/info', methods=['GET'])
def api_info():
    """API information endpoint"""
    return jsonify({
        'api_name': 'Flowlet MVP Backend',
        'version': '1.0.0-mvp',
        'description': 'Simple MVP for wallet and payment functionality',
        'endpoints': {
            'wallet_mvp': '/api/v1/wallet',
            'payment_mvp': '/api/v1/payment'
        },
        'mvp_features': [
            'Wallet Creation and Management',
            'Balance Inquiry',
            'Fund Deposits and Withdrawals',
            'Transaction History',
            'Peer-to-Peer Payments',
            'Transfer Between Wallets'
        ]
    }), 200

@app.route('/api/v1/wallet/create', methods=['POST'])
def create_wallet():
    """Create a new wallet"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['user_id', 'account_name']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Create user if doesn't exist
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute('SELECT id FROM users WHERE id = ?', (data['user_id'],))
        if not cursor.fetchone():
            cursor.execute(
                'INSERT INTO users (id, email, first_name, last_name) VALUES (?, ?, ?, ?)',
                (data['user_id'], f"user{data['user_id'][:8]}@example.com", "Test", "User")
            )
        
        # Create account
        account_id = str(uuid.uuid4())
        account_number = generate_account_number()
        account_type = data.get('account_type', 'checking')
        currency = data.get('currency', 'USD')
        initial_deposit = float(data.get('initial_deposit', 0))
        initial_deposit_cents = int(initial_deposit * 100)
        
        cursor.execute('''
            INSERT INTO accounts (id, user_id, account_name, account_number, account_type, 
                                currency, available_balance, current_balance)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (account_id, data['user_id'], data['account_name'], account_number, 
              account_type, currency, initial_deposit_cents, initial_deposit_cents))
        
        # Create initial deposit transaction if amount > 0
        if initial_deposit > 0:
            transaction_id = str(uuid.uuid4())
            tx_id = generate_transaction_id()
            cursor.execute('''
                INSERT INTO transactions (id, transaction_id, user_id, account_id, 
                                        transaction_type, transaction_category, amount_cents, 
                                        currency, description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (transaction_id, tx_id, data['user_id'], account_id, 'credit', 'deposit',
                  initial_deposit_cents, currency, f"Initial deposit for {data['account_name']}"))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'wallet': {
                'id': account_id,
                'account_name': data['account_name'],
                'account_number': account_number[-4:],  # Masked
                'account_type': account_type,
                'currency': currency,
                'available_balance': initial_deposit,
                'current_balance': initial_deposit,
                'status': 'active'
            },
            'message': 'Wallet created successfully'
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/wallet/<wallet_id>/balance', methods=['GET'])
def get_wallet_balance(wallet_id):
    """Get wallet balance"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT account_name, available_balance, current_balance, currency, updated_at
            FROM accounts WHERE id = ?
        ''', (wallet_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        if not result:
            return jsonify({'error': 'Wallet not found'}), 404
        
        account_name, available_balance, current_balance, currency, updated_at = result
        
        return jsonify({
            'success': True,
            'wallet_id': wallet_id,
            'account_name': account_name,
            'available_balance': available_balance / 100,
            'current_balance': current_balance / 100,
            'currency': currency,
            'last_updated': updated_at
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/wallet/<wallet_id>/deposit', methods=['POST'])
def deposit_funds(wallet_id):
    """Deposit funds into wallet"""
    try:
        data = request.get_json()
        
        if 'amount' not in data:
            return jsonify({'error': 'Missing required field: amount'}), 400
        
        amount = float(data['amount'])
        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400
        
        amount_cents = int(amount * 100)
        description = data.get('description', f'Deposit to wallet')
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Check if wallet exists
        cursor.execute('SELECT user_id, currency FROM accounts WHERE id = ?', (wallet_id,))
        result = cursor.fetchone()
        if not result:
            conn.close()
            return jsonify({'error': 'Wallet not found'}), 404
        
        user_id, currency = result
        
        # Update balance
        cursor.execute('''
            UPDATE accounts 
            SET available_balance = available_balance + ?, 
                current_balance = current_balance + ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (amount_cents, amount_cents, wallet_id))
        
        # Create transaction record
        transaction_id = str(uuid.uuid4())
        tx_id = generate_transaction_id()
        cursor.execute('''
            INSERT INTO transactions (id, transaction_id, user_id, account_id, 
                                    transaction_type, transaction_category, amount_cents, 
                                    currency, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (transaction_id, tx_id, user_id, wallet_id, 'credit', 'deposit',
              amount_cents, currency, description))
        
        # Get new balance
        cursor.execute('SELECT available_balance FROM accounts WHERE id = ?', (wallet_id,))
        new_balance = cursor.fetchone()[0] / 100
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'transaction': {
                'id': transaction_id,
                'transaction_id': tx_id,
                'amount': amount,
                'currency': currency,
                'description': description
            },
            'new_balance': new_balance,
            'message': 'Deposit completed successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/wallet/<wallet_id>/withdraw', methods=['POST'])
def withdraw_funds(wallet_id):
    """Withdraw funds from wallet"""
    try:
        data = request.get_json()
        
        if 'amount' not in data:
            return jsonify({'error': 'Missing required field: amount'}), 400
        
        amount = float(data['amount'])
        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400
        
        amount_cents = int(amount * 100)
        description = data.get('description', f'Withdrawal from wallet')
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Check if wallet exists and has sufficient balance
        cursor.execute('SELECT user_id, available_balance, currency FROM accounts WHERE id = ?', (wallet_id,))
        result = cursor.fetchone()
        if not result:
            conn.close()
            return jsonify({'error': 'Wallet not found'}), 404
        
        user_id, available_balance, currency = result
        
        if available_balance < amount_cents:
            conn.close()
            return jsonify({'error': 'Insufficient funds'}), 400
        
        # Update balance
        cursor.execute('''
            UPDATE accounts 
            SET available_balance = available_balance - ?, 
                current_balance = current_balance - ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (amount_cents, amount_cents, wallet_id))
        
        # Create transaction record
        transaction_id = str(uuid.uuid4())
        tx_id = generate_transaction_id()
        cursor.execute('''
            INSERT INTO transactions (id, transaction_id, user_id, account_id, 
                                    transaction_type, transaction_category, amount_cents, 
                                    currency, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (transaction_id, tx_id, user_id, wallet_id, 'debit', 'withdrawal',
              amount_cents, currency, description))
        
        # Get new balance
        cursor.execute('SELECT available_balance FROM accounts WHERE id = ?', (wallet_id,))
        new_balance = cursor.fetchone()[0] / 100
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'transaction': {
                'id': transaction_id,
                'transaction_id': tx_id,
                'amount': amount,
                'currency': currency,
                'description': description
            },
            'new_balance': new_balance,
            'message': 'Withdrawal completed successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/wallet/<wallet_id>/transactions', methods=['GET'])
def get_transaction_history(wallet_id):
    """Get transaction history for wallet"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Check if wallet exists
        cursor.execute('SELECT id FROM accounts WHERE id = ?', (wallet_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Wallet not found'}), 404
        
        # Get transactions
        cursor.execute('''
            SELECT transaction_id, transaction_type, transaction_category, 
                   amount_cents, currency, description, created_at
            FROM transactions 
            WHERE account_id = ? 
            ORDER BY created_at DESC 
            LIMIT 20
        ''', (wallet_id,))
        
        transactions = []
        for row in cursor.fetchall():
            tx_id, tx_type, tx_category, amount_cents, currency, description, created_at = row
            transactions.append({
                'transaction_id': tx_id,
                'transaction_type': tx_type,
                'transaction_category': tx_category,
                'amount': amount_cents / 100,
                'currency': currency,
                'description': description,
                'created_at': created_at
            })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'wallet_id': wallet_id,
            'transactions': transactions,
            'pagination': {
                'page': 1,
                'per_page': 20,
                'total': len(transactions)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/payment/transfer', methods=['POST'])
def transfer_funds():
    """Transfer funds between wallets"""
    try:
        data = request.get_json()
        
        required_fields = ['from_wallet_id', 'to_wallet_id', 'amount']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        amount = float(data['amount'])
        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400
        
        amount_cents = int(amount * 100)
        description = data.get('description', 'Transfer between wallets')
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Check both wallets exist and get details
        cursor.execute('''
            SELECT user_id, available_balance, currency, account_name 
            FROM accounts WHERE id = ?
        ''', (data['from_wallet_id'],))
        from_result = cursor.fetchone()
        
        cursor.execute('''
            SELECT user_id, currency, account_name 
            FROM accounts WHERE id = ?
        ''', (data['to_wallet_id'],))
        to_result = cursor.fetchone()
        
        if not from_result:
            conn.close()
            return jsonify({'error': 'Source wallet not found'}), 404
        
        if not to_result:
            conn.close()
            return jsonify({'error': 'Destination wallet not found'}), 404
        
        from_user_id, from_balance, from_currency, from_name = from_result
        to_user_id, to_currency, to_name = to_result
        
        # Check currency match
        if from_currency != to_currency:
            conn.close()
            return jsonify({'error': 'Currency mismatch between wallets'}), 400
        
        # Check sufficient balance
        if from_balance < amount_cents:
            conn.close()
            return jsonify({'error': 'Insufficient funds'}), 400
        
        # Generate transfer reference
        transfer_ref = f"TRF-{datetime.now().strftime('%Y%m%d%H%M%S')}-{str(uuid.uuid4())[:8]}"
        
        # Update balances
        cursor.execute('''
            UPDATE accounts 
            SET available_balance = available_balance - ?, 
                current_balance = current_balance - ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (amount_cents, amount_cents, data['from_wallet_id']))
        
        cursor.execute('''
            UPDATE accounts 
            SET available_balance = available_balance + ?, 
                current_balance = current_balance + ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (amount_cents, amount_cents, data['to_wallet_id']))
        
        # Create debit transaction
        debit_tx_id = str(uuid.uuid4())
        debit_tx_ref = generate_transaction_id()
        cursor.execute('''
            INSERT INTO transactions (id, transaction_id, user_id, account_id, 
                                    transaction_type, transaction_category, amount_cents, 
                                    currency, description, reference_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (debit_tx_id, debit_tx_ref, from_user_id, data['from_wallet_id'], 
              'debit', 'transfer', amount_cents, from_currency, 
              f'{description} (Outgoing)', transfer_ref))
        
        # Create credit transaction
        credit_tx_id = str(uuid.uuid4())
        credit_tx_ref = generate_transaction_id()
        cursor.execute('''
            INSERT INTO transactions (id, transaction_id, user_id, account_id, 
                                    transaction_type, transaction_category, amount_cents, 
                                    currency, description, reference_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (credit_tx_id, credit_tx_ref, to_user_id, data['to_wallet_id'], 
              'credit', 'transfer', amount_cents, to_currency, 
              f'{description} (Incoming)', transfer_ref))
        
        # Get new balances
        cursor.execute('SELECT available_balance FROM accounts WHERE id = ?', (data['from_wallet_id'],))
        from_new_balance = cursor.fetchone()[0] / 100
        
        cursor.execute('SELECT available_balance FROM accounts WHERE id = ?', (data['to_wallet_id'],))
        to_new_balance = cursor.fetchone()[0] / 100
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'transfer_reference': transfer_ref,
            'from_wallet': {
                'wallet_id': data['from_wallet_id'],
                'account_name': from_name,
                'new_balance': from_new_balance
            },
            'to_wallet': {
                'wallet_id': data['to_wallet_id'],
                'account_name': to_name,
                'new_balance': to_new_balance
            },
            'transfer_details': {
                'amount': amount,
                'currency': from_currency,
                'description': description,
                'processed_at': datetime.now().isoformat()
            },
            'message': 'Transfer completed successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5001, debug=True)


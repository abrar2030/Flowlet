from flask import Blueprint, request, jsonify
from src.models.database import db, User, Wallet, Transaction, Card
from datetime import datetime, timedelta
from decimal import Decimal
import random

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/dashboard/<user_id>', methods=['GET'])
def get_dashboard_analytics(user_id):
    """Get dashboard analytics for a user"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get user's wallets
        wallets = Wallet.query.filter_by(user_id=user_id).all()
        
        # Calculate total balance across all wallets
        total_balance = sum(wallet.balance for wallet in wallets)
        
        # Get recent transactions (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_transactions = []
        
        for wallet in wallets:
            transactions = Transaction.query.filter_by(wallet_id=wallet.id)\
                .filter(Transaction.created_at >= thirty_days_ago)\
                .order_by(Transaction.created_at.desc()).limit(10).all()
            recent_transactions.extend(transactions)
        
        # Sort by date and limit to 10 most recent
        recent_transactions.sort(key=lambda x: x.created_at, reverse=True)
        recent_transactions = recent_transactions[:10]
        
        # Calculate spending this month
        current_month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        monthly_spending = Decimal('0.00')
        
        for wallet in wallets:
            spending = db.session.query(db.func.sum(Transaction.amount))\
                .filter_by(wallet_id=wallet.id, transaction_type='debit')\
                .filter(Transaction.created_at >= current_month_start)\
                .scalar() or Decimal('0.00')
            monthly_spending += spending
        
        # Get cards count
        total_cards = Card.query.join(Wallet).filter(Wallet.user_id == user_id).count()
        active_cards = Card.query.join(Wallet).filter(Wallet.user_id == user_id, Card.status == 'active').count()
        
        # Format recent transactions
        transaction_list = []
        for transaction in recent_transactions:
            transaction_list.append({
                'id': transaction.id,
                'type': transaction.transaction_type,
                'amount': str(transaction.amount),
                'currency': transaction.currency,
                'description': transaction.description,
                'status': transaction.status,
                'created_at': transaction.created_at.isoformat()
            })
        
        return jsonify({
            'user_id': user_id,
            'summary': {
                'total_balance': str(total_balance),
                'monthly_spending': str(monthly_spending),
                'total_wallets': len(wallets),
                'total_cards': total_cards,
                'active_cards': active_cards
            },
            'recent_transactions': transaction_list,
            'generated_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/spending/<user_id>', methods=['GET'])
def get_spending_analytics(user_id):
    """Get spending analytics for a user"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        period = request.args.get('period', '30d')
        
        # Calculate date range
        if period == '7d':
            start_date = datetime.utcnow() - timedelta(days=7)
        elif period == '30d':
            start_date = datetime.utcnow() - timedelta(days=30)
        elif period == '90d':
            start_date = datetime.utcnow() - timedelta(days=90)
        elif period == '1y':
            start_date = datetime.utcnow() - timedelta(days=365)
        else:
            start_date = datetime.utcnow() - timedelta(days=30)
        
        # Get user's wallets
        wallets = Wallet.query.filter_by(user_id=user_id).all()
        wallet_ids = [wallet.id for wallet in wallets]
        
        # Get spending transactions
        spending_transactions = Transaction.query\
            .filter(Transaction.wallet_id.in_(wallet_ids))\
            .filter(Transaction.transaction_type == 'debit')\
            .filter(Transaction.created_at >= start_date)\
            .all()
        
        # Calculate daily spending
        daily_spending = {}
        category_spending = {
            'food_dining': Decimal('0.00'),
            'shopping': Decimal('0.00'),
            'transportation': Decimal('0.00'),
            'entertainment': Decimal('0.00'),
            'bills_utilities': Decimal('0.00'),
            'other': Decimal('0.00')
        }
        
        for transaction in spending_transactions:
            date_key = transaction.created_at.date().isoformat()
            if date_key not in daily_spending:
                daily_spending[date_key] = Decimal('0.00')
            daily_spending[date_key] += transaction.amount
            
            # Categorize spending (simplified categorization)
            description = transaction.description.lower()
            if any(word in description for word in ['restaurant', 'food', 'dining', 'cafe']):
                category_spending['food_dining'] += transaction.amount
            elif any(word in description for word in ['store', 'shop', 'retail', 'amazon']):
                category_spending['shopping'] += transaction.amount
            elif any(word in description for word in ['gas', 'fuel', 'uber', 'taxi', 'transport']):
                category_spending['transportation'] += transaction.amount
            elif any(word in description for word in ['movie', 'game', 'entertainment', 'netflix']):
                category_spending['entertainment'] += transaction.amount
            elif any(word in description for word in ['bill', 'utility', 'electric', 'water', 'internet']):
                category_spending['bills_utilities'] += transaction.amount
            else:
                category_spending['other'] += transaction.amount
        
        # Convert to list format for charts
        daily_data = [{'date': date, 'amount': str(amount)} for date, amount in sorted(daily_spending.items())]
        category_data = [{'category': category, 'amount': str(amount)} for category, amount in category_spending.items()]
        
        total_spending = sum(category_spending.values())
        
        return jsonify({
            'user_id': user_id,
            'period': period,
            'total_spending': str(total_spending),
            'daily_spending': daily_data,
            'category_breakdown': category_data,
            'transaction_count': len(spending_transactions),
            'generated_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/income/<user_id>', methods=['GET'])
def get_income_analytics(user_id):
    """Get income analytics for a user"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        period = request.args.get('period', '30d')
        
        # Calculate date range
        if period == '7d':
            start_date = datetime.utcnow() - timedelta(days=7)
        elif period == '30d':
            start_date = datetime.utcnow() - timedelta(days=30)
        elif period == '90d':
            start_date = datetime.utcnow() - timedelta(days=90)
        elif period == '1y':
            start_date = datetime.utcnow() - timedelta(days=365)
        else:
            start_date = datetime.utcnow() - timedelta(days=30)
        
        # Get user's wallets
        wallets = Wallet.query.filter_by(user_id=user_id).all()
        wallet_ids = [wallet.id for wallet in wallets]
        
        # Get income transactions (credits)
        income_transactions = Transaction.query\
            .filter(Transaction.wallet_id.in_(wallet_ids))\
            .filter(Transaction.transaction_type == 'credit')\
            .filter(Transaction.created_at >= start_date)\
            .all()
        
        # Calculate daily income
        daily_income = {}
        source_income = {
            'salary': Decimal('0.00'),
            'freelance': Decimal('0.00'),
            'investment': Decimal('0.00'),
            'transfer': Decimal('0.00'),
            'other': Decimal('0.00')
        }
        
        for transaction in income_transactions:
            date_key = transaction.created_at.date().isoformat()
            if date_key not in daily_income:
                daily_income[date_key] = Decimal('0.00')
            daily_income[date_key] += transaction.amount
            
            # Categorize income sources
            description = transaction.description.lower()
            if any(word in description for word in ['salary', 'payroll', 'wage']):
                source_income['salary'] += transaction.amount
            elif any(word in description for word in ['freelance', 'contract', 'gig']):
                source_income['freelance'] += transaction.amount
            elif any(word in description for word in ['dividend', 'interest', 'investment']):
                source_income['investment'] += transaction.amount
            elif any(word in description for word in ['transfer', 'deposit']):
                source_income['transfer'] += transaction.amount
            else:
                source_income['other'] += transaction.amount
        
        # Convert to list format
        daily_data = [{'date': date, 'amount': str(amount)} for date, amount in sorted(daily_income.items())]
        source_data = [{'source': source, 'amount': str(amount)} for source, amount in source_income.items()]
        
        total_income = sum(source_income.values())
        
        return jsonify({
            'user_id': user_id,
            'period': period,
            'total_income': str(total_income),
            'daily_income': daily_data,
            'source_breakdown': source_data,
            'transaction_count': len(income_transactions),
            'generated_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/balance-history/<user_id>', methods=['GET'])
def get_balance_history(user_id):
    """Get balance history for a user"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        period = request.args.get('period', '30d')
        
        # Calculate date range
        if period == '7d':
            start_date = datetime.utcnow() - timedelta(days=7)
            interval_days = 1
        elif period == '30d':
            start_date = datetime.utcnow() - timedelta(days=30)
            interval_days = 1
        elif period == '90d':
            start_date = datetime.utcnow() - timedelta(days=90)
            interval_days = 3
        elif period == '1y':
            start_date = datetime.utcnow() - timedelta(days=365)
            interval_days = 7
        else:
            start_date = datetime.utcnow() - timedelta(days=30)
            interval_days = 1
        
        # Get user's wallets
        wallets = Wallet.query.filter_by(user_id=user_id).all()
        current_total_balance = sum(wallet.balance for wallet in wallets)
        
        # Generate balance history (simplified - in production, you'd store daily snapshots)
        balance_history = []
        current_date = start_date
        
        while current_date <= datetime.utcnow():
            # Simulate balance changes (in production, use actual historical data)
            days_from_start = (current_date - start_date).days
            variation = random.uniform(-0.1, 0.1)  # ±10% variation
            simulated_balance = current_total_balance * (1 + variation * (days_from_start / 30))
            
            balance_history.append({
                'date': current_date.date().isoformat(),
                'balance': str(max(Decimal('0.00'), Decimal(str(simulated_balance))))
            })
            
            current_date += timedelta(days=interval_days)
        
        return jsonify({
            'user_id': user_id,
            'period': period,
            'current_balance': str(current_total_balance),
            'balance_history': balance_history,
            'generated_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


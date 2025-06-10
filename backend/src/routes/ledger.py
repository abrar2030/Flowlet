from flask import Blueprint, request, jsonify
from src.models.database import db, LedgerEntry, Transaction, Wallet
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy import func, and_

ledger_bp = Blueprint('ledger', __name__)

@ledger_bp.route('/entries', methods=['GET'])
def get_ledger_entries():
    """Get ledger entries with filtering and pagination"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        account_type = request.args.get('account_type')
        account_name = request.args.get('account_name')
        currency = request.args.get('currency')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Build query
        query = LedgerEntry.query
        
        if account_type:
            query = query.filter(LedgerEntry.account_type == account_type)
        
        if account_name:
            query = query.filter(LedgerEntry.account_name.like(f'%{account_name}%'))
        
        if currency:
            query = query.filter(LedgerEntry.currency == currency)
        
        if start_date:
            start_dt = datetime.strptime(start_date, '%Y-%m-%d')
            query = query.filter(LedgerEntry.created_at >= start_dt)
        
        if end_date:
            end_dt = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)
            query = query.filter(LedgerEntry.created_at < end_dt)
        
        # Execute query with pagination
        entries = query.order_by(LedgerEntry.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        entry_list = []
        for entry in entries.items:
            entry_list.append({
                'entry_id': entry.id,
                'transaction_id': entry.transaction_id,
                'account_type': entry.account_type,
                'account_name': entry.account_name,
                'debit_amount': str(entry.debit_amount),
                'credit_amount': str(entry.credit_amount),
                'currency': entry.currency,
                'description': entry.description,
                'created_at': entry.created_at.isoformat()
            })
        
        return jsonify({
            'entries': entry_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': entries.total,
                'pages': entries.pages,
                'has_next': entries.has_next,
                'has_prev': entries.has_prev
            },
            'filters_applied': {
                'account_type': account_type,
                'account_name': account_name,
                'currency': currency,
                'start_date': start_date,
                'end_date': end_date
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ledger_bp.route('/trial-balance', methods=['GET'])
def get_trial_balance():
    """Generate trial balance report"""
    try:
        # Get date parameter
        as_of_date = request.args.get('as_of_date')
        if as_of_date:
            as_of_dt = datetime.strptime(as_of_date, '%Y-%m-%d') + timedelta(days=1)
        else:
            as_of_dt = datetime.utcnow()
        
        currency = request.args.get('currency', 'USD')
        
        # Query ledger entries up to the specified date
        entries = LedgerEntry.query.filter(
            and_(
                LedgerEntry.created_at < as_of_dt,
                LedgerEntry.currency == currency
            )
        ).all()
        
        # Calculate balances by account
        account_balances = {}
        
        for entry in entries:
            account_key = f"{entry.account_type}:{entry.account_name}"
            
            if account_key not in account_balances:
                account_balances[account_key] = {
                    'account_type': entry.account_type,
                    'account_name': entry.account_name,
                    'total_debits': Decimal('0.00'),
                    'total_credits': Decimal('0.00'),
                    'balance': Decimal('0.00')
                }
            
            account_balances[account_key]['total_debits'] += entry.debit_amount
            account_balances[account_key]['total_credits'] += entry.credit_amount
        
        # Calculate net balances
        total_debits = Decimal('0.00')
        total_credits = Decimal('0.00')
        
        for account_key, account_data in account_balances.items():
            # For assets and expenses, debit balance is positive
            # For liabilities, equity, and revenue, credit balance is positive
            if account_data['account_type'] in ['asset', 'expense']:
                account_data['balance'] = account_data['total_debits'] - account_data['total_credits']
            else:  # liability, equity, revenue
                account_data['balance'] = account_data['total_credits'] - account_data['total_debits']
            
            total_debits += account_data['total_debits']
            total_credits += account_data['total_credits']
        
        # Convert to list and sort by account type and name
        trial_balance_list = list(account_balances.values())
        trial_balance_list.sort(key=lambda x: (x['account_type'], x['account_name']))
        
        # Convert Decimal to string for JSON serialization
        for account in trial_balance_list:
            account['total_debits'] = str(account['total_debits'])
            account['total_credits'] = str(account['total_credits'])
            account['balance'] = str(account['balance'])
        
        return jsonify({
            'trial_balance': trial_balance_list,
            'summary': {
                'total_debits': str(total_debits),
                'total_credits': str(total_credits),
                'difference': str(total_debits - total_credits),
                'balanced': total_debits == total_credits
            },
            'as_of_date': as_of_dt.date().isoformat(),
            'currency': currency,
            'generated_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ledger_bp.route('/balance-sheet', methods=['GET'])
def get_balance_sheet():
    """Generate balance sheet report"""
    try:
        # Get date parameter
        as_of_date = request.args.get('as_of_date')
        if as_of_date:
            as_of_dt = datetime.strptime(as_of_date, '%Y-%m-%d') + timedelta(days=1)
        else:
            as_of_dt = datetime.utcnow()
        
        currency = request.args.get('currency', 'USD')
        
        # Query ledger entries for balance sheet accounts (assets, liabilities, equity)
        entries = LedgerEntry.query.filter(
            and_(
                LedgerEntry.created_at < as_of_dt,
                LedgerEntry.currency == currency,
                LedgerEntry.account_type.in_(['asset', 'liability', 'equity'])
            )
        ).all()
        
        # Calculate balances by account type
        assets = {}
        liabilities = {}
        equity = {}
        
        for entry in entries:
            account_name = entry.account_name
            
            if entry.account_type == 'asset':
                if account_name not in assets:
                    assets[account_name] = Decimal('0.00')
                assets[account_name] += entry.debit_amount - entry.credit_amount
            
            elif entry.account_type == 'liability':
                if account_name not in liabilities:
                    liabilities[account_name] = Decimal('0.00')
                liabilities[account_name] += entry.credit_amount - entry.debit_amount
            
            elif entry.account_type == 'equity':
                if account_name not in equity:
                    equity[account_name] = Decimal('0.00')
                equity[account_name] += entry.credit_amount - entry.debit_amount
        
        # Calculate totals
        total_assets = sum(assets.values())
        total_liabilities = sum(liabilities.values())
        total_equity = sum(equity.values())
        
        # Convert to lists for JSON response
        assets_list = [{'account': k, 'balance': str(v)} for k, v in assets.items()]
        liabilities_list = [{'account': k, 'balance': str(v)} for k, v in liabilities.items()]
        equity_list = [{'account': k, 'balance': str(v)} for k, v in equity.items()]
        
        return jsonify({
            'balance_sheet': {
                'assets': {
                    'accounts': assets_list,
                    'total': str(total_assets)
                },
                'liabilities': {
                    'accounts': liabilities_list,
                    'total': str(total_liabilities)
                },
                'equity': {
                    'accounts': equity_list,
                    'total': str(total_equity)
                }
            },
            'totals': {
                'total_assets': str(total_assets),
                'total_liabilities_and_equity': str(total_liabilities + total_equity),
                'balanced': total_assets == (total_liabilities + total_equity)
            },
            'as_of_date': as_of_dt.date().isoformat(),
            'currency': currency,
            'generated_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ledger_bp.route('/income-statement', methods=['GET'])
def get_income_statement():
    """Generate income statement (P&L) report"""
    try:
        # Get date range parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if not start_date or not end_date:
            # Default to current month
            now = datetime.utcnow()
            start_date = now.replace(day=1).date().isoformat()
            end_date = now.date().isoformat()
        
        start_dt = datetime.strptime(start_date, '%Y-%m-%d')
        end_dt = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)
        
        currency = request.args.get('currency', 'USD')
        
        # Query ledger entries for revenue and expense accounts
        entries = LedgerEntry.query.filter(
            and_(
                LedgerEntry.created_at >= start_dt,
                LedgerEntry.created_at < end_dt,
                LedgerEntry.currency == currency,
                LedgerEntry.account_type.in_(['revenue', 'expense'])
            )
        ).all()
        
        # Calculate balances
        revenue = {}
        expenses = {}
        
        for entry in entries:
            account_name = entry.account_name
            
            if entry.account_type == 'revenue':
                if account_name not in revenue:
                    revenue[account_name] = Decimal('0.00')
                revenue[account_name] += entry.credit_amount - entry.debit_amount
            
            elif entry.account_type == 'expense':
                if account_name not in expenses:
                    expenses[account_name] = Decimal('0.00')
                expenses[account_name] += entry.debit_amount - entry.credit_amount
        
        # Calculate totals
        total_revenue = sum(revenue.values())
        total_expenses = sum(expenses.values())
        net_income = total_revenue - total_expenses
        
        # Convert to lists for JSON response
        revenue_list = [{'account': k, 'amount': str(v)} for k, v in revenue.items()]
        expenses_list = [{'account': k, 'amount': str(v)} for k, v in expenses.items()]
        
        return jsonify({
            'income_statement': {
                'revenue': {
                    'accounts': revenue_list,
                    'total': str(total_revenue)
                },
                'expenses': {
                    'accounts': expenses_list,
                    'total': str(total_expenses)
                },
                'net_income': str(net_income)
            },
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'currency': currency,
            'generated_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ledger_bp.route('/cash-flow', methods=['GET'])
def get_cash_flow():
    """Generate cash flow statement"""
    try:
        # Get date range parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if not start_date or not end_date:
            # Default to current month
            now = datetime.utcnow()
            start_date = now.replace(day=1).date().isoformat()
            end_date = now.date().isoformat()
        
        start_dt = datetime.strptime(start_date, '%Y-%m-%d')
        end_dt = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)
        
        currency = request.args.get('currency', 'USD')
        
        # Query cash and bank account entries
        cash_entries = LedgerEntry.query.filter(
            and_(
                LedgerEntry.created_at >= start_dt,
                LedgerEntry.created_at < end_dt,
                LedgerEntry.currency == currency,
                LedgerEntry.account_name.like('%Cash%')
            )
        ).all()
        
        # Calculate cash flows by category
        operating_cash_flow = Decimal('0.00')
        investing_cash_flow = Decimal('0.00')
        financing_cash_flow = Decimal('0.00')
        
        cash_flow_details = {
            'operating': [],
            'investing': [],
            'financing': []
        }
        
        for entry in cash_entries:
            net_change = entry.debit_amount - entry.credit_amount
            
            # Categorize cash flows based on transaction description
            description = entry.description.lower()
            
            if any(keyword in description for keyword in ['payment', 'deposit', 'withdrawal', 'transfer']):
                operating_cash_flow += net_change
                cash_flow_details['operating'].append({
                    'description': entry.description,
                    'amount': str(net_change),
                    'date': entry.created_at.isoformat()
                })
            elif any(keyword in description for keyword in ['investment', 'asset']):
                investing_cash_flow += net_change
                cash_flow_details['investing'].append({
                    'description': entry.description,
                    'amount': str(net_change),
                    'date': entry.created_at.isoformat()
                })
            else:
                financing_cash_flow += net_change
                cash_flow_details['financing'].append({
                    'description': entry.description,
                    'amount': str(net_change),
                    'date': entry.created_at.isoformat()
                })
        
        net_cash_flow = operating_cash_flow + investing_cash_flow + financing_cash_flow
        
        return jsonify({
            'cash_flow_statement': {
                'operating_activities': {
                    'total': str(operating_cash_flow),
                    'details': cash_flow_details['operating']
                },
                'investing_activities': {
                    'total': str(investing_cash_flow),
                    'details': cash_flow_details['investing']
                },
                'financing_activities': {
                    'total': str(financing_cash_flow),
                    'details': cash_flow_details['financing']
                },
                'net_cash_flow': str(net_cash_flow)
            },
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'currency': currency,
            'generated_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ledger_bp.route('/reconciliation', methods=['POST'])
def reconcile_accounts():
    """Perform account reconciliation"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['account_name', 'external_balance', 'currency']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        account_name = data['account_name']
        external_balance = Decimal(str(data['external_balance']))
        currency = data['currency']
        as_of_date = data.get('as_of_date')
        
        if as_of_date:
            as_of_dt = datetime.strptime(as_of_date, '%Y-%m-%d') + timedelta(days=1)
        else:
            as_of_dt = datetime.utcnow()
        
        # Calculate internal balance
        entries = LedgerEntry.query.filter(
            and_(
                LedgerEntry.account_name == account_name,
                LedgerEntry.currency == currency,
                LedgerEntry.created_at < as_of_dt
            )
        ).all()
        
        internal_balance = Decimal('0.00')
        for entry in entries:
            if entry.account_type in ['asset', 'expense']:
                internal_balance += entry.debit_amount - entry.credit_amount
            else:  # liability, equity, revenue
                internal_balance += entry.credit_amount - entry.debit_amount
        
        # Calculate difference
        difference = internal_balance - external_balance
        is_reconciled = abs(difference) < Decimal('0.01')  # Allow for rounding differences
        
        # Get recent transactions for review
        recent_entries = LedgerEntry.query.filter(
            and_(
                LedgerEntry.account_name == account_name,
                LedgerEntry.currency == currency,
                LedgerEntry.created_at >= (as_of_dt - timedelta(days=7))
            )
        ).order_by(LedgerEntry.created_at.desc()).limit(10).all()
        
        recent_transactions = []
        for entry in recent_entries:
            recent_transactions.append({
                'entry_id': entry.id,
                'transaction_id': entry.transaction_id,
                'debit_amount': str(entry.debit_amount),
                'credit_amount': str(entry.credit_amount),
                'description': entry.description,
                'created_at': entry.created_at.isoformat()
            })
        
        return jsonify({
            'reconciliation': {
                'account_name': account_name,
                'currency': currency,
                'as_of_date': as_of_dt.date().isoformat(),
                'internal_balance': str(internal_balance),
                'external_balance': str(external_balance),
                'difference': str(difference),
                'is_reconciled': is_reconciled,
                'reconciliation_status': 'reconciled' if is_reconciled else 'discrepancy_found'
            },
            'recent_transactions': recent_transactions,
            'reconciled_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ledger_bp.route('/audit-trail/<transaction_id>', methods=['GET'])
def get_audit_trail(transaction_id):
    """Get complete audit trail for a transaction"""
    try:
        # Get transaction details
        transaction = Transaction.query.get(transaction_id)
        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404
        
        # Get all ledger entries for this transaction
        ledger_entries = LedgerEntry.query.filter_by(transaction_id=transaction_id)\
            .order_by(LedgerEntry.created_at).all()
        
        entries_list = []
        for entry in ledger_entries:
            entries_list.append({
                'entry_id': entry.id,
                'account_type': entry.account_type,
                'account_name': entry.account_name,
                'debit_amount': str(entry.debit_amount),
                'credit_amount': str(entry.credit_amount),
                'currency': entry.currency,
                'description': entry.description,
                'created_at': entry.created_at.isoformat()
            })
        
        # Verify double-entry integrity
        total_debits = sum(Decimal(entry['debit_amount']) for entry in entries_list)
        total_credits = sum(Decimal(entry['credit_amount']) for entry in entries_list)
        is_balanced = total_debits == total_credits
        
        return jsonify({
            'transaction': {
                'transaction_id': transaction.id,
                'wallet_id': transaction.wallet_id,
                'type': transaction.transaction_type,
                'amount': str(transaction.amount),
                'currency': transaction.currency,
                'description': transaction.description,
                'status': transaction.status,
                'created_at': transaction.created_at.isoformat()
            },
            'ledger_entries': entries_list,
            'integrity_check': {
                'total_debits': str(total_debits),
                'total_credits': str(total_credits),
                'is_balanced': is_balanced,
                'entry_count': len(entries_list)
            },
            'audit_trail_generated_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ledger_bp.route('/accounts', methods=['GET'])
def get_chart_of_accounts():
    """Get chart of accounts"""
    try:
        # Get unique account combinations
        accounts = db.session.query(
            LedgerEntry.account_type,
            LedgerEntry.account_name,
            LedgerEntry.currency
        ).distinct().all()
        
        # Group by account type
        chart_of_accounts = {
            'asset': [],
            'liability': [],
            'equity': [],
            'revenue': [],
            'expense': []
        }
        
        for account_type, account_name, currency in accounts:
            if account_type in chart_of_accounts:
                chart_of_accounts[account_type].append({
                    'account_name': account_name,
                    'currency': currency
                })
        
        # Sort accounts within each type
        for account_type in chart_of_accounts:
            chart_of_accounts[account_type].sort(key=lambda x: x['account_name'])
        
        return jsonify({
            'chart_of_accounts': chart_of_accounts,
            'total_accounts': sum(len(accounts) for accounts in chart_of_accounts.values()),
            'generated_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


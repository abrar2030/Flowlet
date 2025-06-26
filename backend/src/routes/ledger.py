from flask import Blueprint, request, jsonify, g
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from sqlalchemy import and_, or_, func, text
from sqlalchemy.exc import IntegrityError
from decimal import Decimal, ROUND_HALF_UP
import uuid
from datetime import datetime, timezone, timedelta
import json
import logging
from typing import Dict, List, Optional, Tuple
from enum import Enum

from ..models.database import db, LedgerEntry, Transaction, Wallet, User, AuditLog
from ..security.encryption import encrypt_sensitive_data, decrypt_sensitive_data
from ..security.validation import validate_currency, validate_amount
from ..utils.audit import log_audit_event
from ..utils.notifications import send_notification

# Create blueprint
ledger_bp = Blueprint(\'ledger\', __name__, url_prefix=\'/api/v1/ledger\')

# Configure rate limiting
limiter = Limiter(key_func=get_remote_address)

logger = logging.getLogger(__name__)

class AccountType(Enum):
    """Chart of accounts types"""
    ASSET = "asset"
    LIABILITY = "liability"
    EQUITY = "equity"
    REVENUE = "revenue"
    EXPENSE = "expense"

class LedgerService:
    """
    Ledger Service implementing financial industry standards
    Provides double-entry bookkeeping, financial reporting, and reconciliation
    """
    
    # Standard chart of accounts
    CHART_OF_ACCOUNTS = {
        # Assets
        'cash_and_equivalents': {'type': AccountType.ASSET, 'name': 'Cash and Cash Equivalents'},
        'customer_deposits': {'type': AccountType.LIABILITY, 'name': 'Customer Deposits'},
        'accounts_receivable': {'type': AccountType.ASSET, 'name': 'Accounts Receivable'},
        'prepaid_expenses': {'type': AccountType.ASSET, 'name': 'Prepaid Expenses'},
        'fixed_assets': {'type': AccountType.ASSET, 'name': 'Fixed Assets'},
        
        # Liabilities
        'accounts_payable': {'type': AccountType.LIABILITY, 'name': 'Accounts Payable'},
        'accrued_liabilities': {'type': AccountType.LIABILITY, 'name': 'Accrued Liabilities'},
        'deferred_revenue': {'type': AccountType.LIABILITY, 'name': 'Deferred Revenue'},
        'long_term_debt': {'type': AccountType.LIABILITY, 'name': 'Long-term Debt'},
        
        # Equity
        'retained_earnings': {'type': AccountType.EQUITY, 'name': 'Retained Earnings'},
        'common_stock': {'type': AccountType.EQUITY, 'name': 'Common Stock'},
        'additional_paid_capital': {'type': AccountType.EQUITY, 'name': 'Additional Paid-in Capital'},
        
        # Revenue
        'transaction_fees': {'type': AccountType.REVENUE, 'name': 'Transaction Fee Revenue'},
        'interchange_revenue': {'type': AccountType.REVENUE, 'name': 'Interchange Revenue'},
        'interest_income': {'type': AccountType.REVENUE, 'name': 'Interest Income'},
        'other_revenue': {'type': AccountType.REVENUE, 'name': 'Other Revenue'},
        
        # Expenses
        'processing_costs': {'type': AccountType.EXPENSE, 'name': 'Payment Processing Costs'},
        'operational_expenses': {'type': AccountType.EXPENSE, 'name': 'Operational Expenses'},
        'compliance_costs': {'type': AccountType.EXPENSE, 'name': 'Compliance and Regulatory Costs'},
        'technology_expenses': {'type': AccountType.EXPENSE, 'name': 'Technology Expenses'},
        'personnel_expenses': {'type': AccountType.EXPENSE, 'name': 'Personnel Expenses'}
    }
    
    @staticmethod
    def create_journal_entry(transaction_id: str, entries: List[Dict], 
                           description: str = None, reference: str = None) -> Dict:
        """
        Create a journal entry with multiple ledger entries (double-entry bookkeeping)
        
        Args:
            transaction_id: Associated transaction ID
            entries: List of ledger entry dictionaries
            description: Journal entry description
            reference: External reference
            
        Returns:
            Dict containing journal entry result
        """
        try:
            # Validate that debits equal credits
            total_debits = sum(Decimal(str(entry.get('debit_amount', 0))) for entry in entries)
            total_credits = sum(Decimal(str(entry.get('credit_amount', 0))) for entry in entries)
            
            if total_debits != total_credits:
                return {
                    'success': False,
                    'error': 'UNBALANCED_ENTRY',
                    'message': f'Debits ({total_debits}) must equal credits ({total_credits})'
                }
            
            # Validate minimum two entries
            if len(entries) < 2:
                return {
                    'success': False,
                    'error': 'INSUFFICIENT_ENTRIES',
                    'message': 'Journal entry must have at least two ledger entries'
                }
            
            # Create ledger entries
            ledger_entries = []
            journal_entry_id = str(uuid.uuid4())
            
            for entry_data in entries:
                # Validate required fields
                required_fields = ['account_name', 'currency']
                for field in required_fields:
                    if field not in entry_data:
                        return {
                            'success': False,
                            'error': 'MISSING_REQUIRED_FIELD',
                            'message': f'Missing required field: {field}'
                        }
                
                # Validate account exists in chart of accounts
                account_name = entry_data['account_name']
                if account_name not in LedgerService.CHART_OF_ACCOUNTS:
                    return {
                        'success': False,
                        'error': 'INVALID_ACCOUNT',
                        'message': f'Account {account_name} not found in chart of accounts'
                    }
                
                # Get account type
                account_info = LedgerService.CHART_OF_ACCOUNTS[account_name]
                
                # Create ledger entry
                ledger_entry = LedgerEntry(
                    id=str(uuid.uuid4()),
                    transaction_id=transaction_id,
                    account_type=account_info['type'].value,
                    account_name=account_name,
                    debit_amount=Decimal(str(entry_data.get('debit_amount', 0))),
                    credit_amount=Decimal(str(entry_data.get('credit_amount', 0))),
                    currency=entry_data['currency'],
                    description=entry_data.get('description') or description,
                    created_at=datetime.now(timezone.utc)
                )
                
                ledger_entries.append(ledger_entry)
                db.session.add(ledger_entry)
            
            db.session.commit()
            
            # Log audit event
            log_audit_event(
                user_id=getattr(g, 'user_id', None),
                action='JOURNAL_ENTRY_CREATED',
                resource_type='journal_entry',
                resource_id=journal_entry_id,
                details={
                    'transaction_id': transaction_id,
                    'total_amount': str(total_debits),
                    'entry_count': len(entries),
                    'description': description
                }
            )
            
            return {
                'success': True,
                'journal_entry_id': journal_entry_id,
                'transaction_id': transaction_id,
                'total_debits': str(total_debits),
                'total_credits': str(total_credits),
                'entry_count': len(entries),
                'created_at': datetime.now(timezone.utc).isoformat() + 'Z'
            }
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error creating journal entry: {str(e)}")
            return {
                'success': False,
                'error': 'INTERNAL_ERROR',
                'message': 'Failed to create journal entry'
            }
    
    @staticmethod
    def get_account_balance(account_name: str, currency: str = None, 
                          as_of_date: datetime = None) -> Dict:
        """
        Get account balance as of a specific date
        
        Args:
            account_name: Account name from chart of accounts
            currency: Currency filter (optional)
            as_of_date: Balance as of this date (optional, defaults to now)
            
        Returns:
            Dict containing account balance information
        """
        try:
            if account_name not in LedgerService.CHART_OF_ACCOUNTS:
                return {
                    'success': False,
                    'error': 'INVALID_ACCOUNT',
                    'message': f'Account {account_name} not found in chart of accounts'
                }
            
            account_info = LedgerService.CHART_OF_ACCOUNTS[account_name]
            
            # Build query
            query = LedgerEntry.query.filter(LedgerEntry.account_name == account_name)
            
            if currency:
                query = query.filter(LedgerEntry.currency == currency)
            
            if as_of_date:
                query = query.filter(LedgerEntry.created_at <= as_of_date)
            
            # Calculate balance based on account type
            account_type = account_info['type']
            
            if account_type in [AccountType.ASSET, AccountType.EXPENSE]:
                # For assets and expenses, debits increase balance
                balance_query = query.with_entities(
                    func.sum(LedgerEntry.debit_amount - LedgerEntry.credit_amount).label('balance')
                )
            else:
                # For liabilities, equity, and revenue, credits increase balance
                balance_query = query.with_entities(
                    func.sum(LedgerEntry.credit_amount - LedgerEntry.debit_amount).label('balance')
                )
            
            result = balance_query.first()
            balance = result.balance if result.balance else Decimal('0.00')
            
            # Get currency breakdown if no specific currency requested
            currency_balances = {}
            if not currency:
                currency_query = query.with_entities(
                    LedgerEntry.currency,
                    func.sum(LedgerEntry.debit_amount).label('total_debits'),
                    func.sum(LedgerEntry.credit_amount).label('total_credits')
                ).group_by(LedgerEntry.currency)
                
                for row in currency_query.all():
                    if account_type in [AccountType.ASSET, AccountType.EXPENSE]:
                        curr_balance = row.total_debits - row.total_credits
                    else:
                        curr_balance = row.total_credits - row.total_debits
                    
                    currency_balances[row.currency] = str(curr_balance)
            
            return {
                'success': True,
                'account_name': account_name,
                'account_type': account_type.value,
                'account_display_name': account_info['name'],
                'balance': str(balance),
                'currency': currency,
                'currency_balances': currency_balances,
                'as_of_date': (as_of_date or datetime.now(timezone.utc)).isoformat() + 'Z'
            }
            
        except Exception as e:
            logger.error(f"Error getting account balance: {str(e)}")
            return {
                'success': False,
                'error': 'INTERNAL_ERROR',
                'message': 'Failed to retrieve account balance'
            }
    
    @staticmethod
    def generate_trial_balance(as_of_date: datetime = None, currency: str = 'USD') -> Dict:
        """
        Generate trial balance report
        
        Args:
            as_of_date: Report date (optional, defaults to now)
            currency: Currency for the report
            
        Returns:
            Dict containing trial balance
        """
        try:
            if not as_of_date:
                as_of_date = datetime.now(timezone.utc)
            
            trial_balance = {
                'report_date': as_of_date.isoformat() + 'Z',
                'currency': currency,
                'accounts': [],
                'totals': {
                    'total_debits': Decimal('0.00'),
                    'total_credits': Decimal('0.00')
                }
            }
            
            # Get balances for all accounts
            for account_name, account_info in LedgerService.CHART_OF_ACCOUNTS.items():
                balance_result = LedgerService.get_account_balance(
                    account_name=account_name,
                    currency=currency,
                    as_of_date=as_of_date
                )
                
                if balance_result['success']:
                    balance = Decimal(balance_result['balance'])
                    
                    # Determine debit/credit presentation
                    if account_info['type'] in [AccountType.ASSET, AccountType.EXPENSE]:
                        debit_balance = balance if balance > 0 else Decimal('0.00')
                        credit_balance = abs(balance) if balance < 0 else Decimal('0.00')
                    else:
                        credit_balance = balance if balance > 0 else Decimal('0.00')
                        debit_balance = abs(balance) if balance < 0 else Decimal('0.00')
                    
                    trial_balance['accounts'].append({
                        'account_name': account_name,
                        'account_display_name': account_info['name'],
                        'account_type': account_info['type'].value,
                        'debit_balance': str(debit_balance),
                        'credit_balance': str(credit_balance)
                    })
                    
                    trial_balance['totals']['total_debits'] += debit_balance
                    trial_balance['totals']['total_credits'] += credit_balance
            
            # Convert totals to strings
            trial_balance['totals']['total_debits'] = str(trial_balance['totals']['total_debits'])
            trial_balance['totals']['total_credits'] = str(trial_balance['totals']['total_credits'])
            
            # Check if trial balance balances
            trial_balance['balanced'] = (
                trial_balance['totals']['total_debits'] == 
                trial_balance['totals']['total_credits']
            )
            
            return {
                'success': True,
                'trial_balance': trial_balance
            }
            
        except Exception as e:
            logger.error(f"Error generating trial balance: {str(e)}")
            return {
                'success': False,
                'error': 'INTERNAL_ERROR',
                'message': 'Failed to generate trial balance'
            }
    
    @staticmethod
    def generate_balance_sheet(as_of_date: datetime = None, currency: str = 'USD') -> Dict:
        """
        Generate balance sheet report
        
        Args:
            as_of_date: Report date (optional, defaults to now)
            currency: Currency for the report
            
        Returns:
            Dict containing balance sheet
        """
        try:
            if not as_of_date:
                as_of_date = datetime.now(timezone.utc)
            
            balance_sheet = {
                'report_date': as_of_date.isoformat() + 'Z',
                'currency': currency,
                'assets': {
                    'current_assets': [],
                    'non_current_assets': [],
                    'total_assets': Decimal('0.00')
                },
                'liabilities': {
                    'current_liabilities': [],
                    'non_current_liabilities': [],
                    'total_liabilities': Decimal('0.00')
                },
                'equity': {
                    'equity_accounts': [],
                    'total_equity': Decimal('0.00')
                }
            }
            
            # Process each account type
            for account_name, account_info in LedgerService.CHART_OF_ACCOUNTS.items():
                if account_info['type'] in [AccountType.ASSET, AccountType.LIABILITY, AccountType.EQUITY]:
                    balance_result = LedgerService.get_account_balance(
                        account_name=account_name,
                        currency=currency,
                        as_of_date=as_of_date
                    )
                    
                    if balance_result['success']:
                        balance = Decimal(balance_result['balance'])
                        
                        account_data = {
                            'account_name': account_name,
                            'account_display_name': account_info['name'],
                            'balance': str(balance)
                        }
                        
                        if account_info['type'] == AccountType.ASSET:
                            # Categorize as current or non-current (simplified logic)
                            if account_name in ['cash_and_equivalents', 'accounts_receivable']:
                                balance_sheet['assets']['current_assets'].append(account_data)
                            else:
                                balance_sheet['assets']['non_current_assets'].append(account_data)
                            balance_sheet['assets']['total_assets'] += balance
                            
                        elif account_info['type'] == AccountType.LIABILITY:
                            # Categorize as current or non-current (simplified logic)
                            if account_name in ['accounts_payable', 'accrued_liabilities']:
                                balance_sheet['liabilities']['current_liabilities'].append(account_data)
                            else:
                                balance_sheet['liabilities']['non_current_liabilities'].append(account_data)
                            balance_sheet['liabilities']['total_liabilities'] += balance
                            
                        elif account_info['type'] == AccountType.EQUITY:
                            balance_sheet['equity']['equity_accounts'].append(account_data)
                            balance_sheet['equity']['total_equity'] += balance
            
            # Convert totals to strings
            balance_sheet['assets']['total_assets'] = str(balance_sheet['assets']['total_assets'])
            balance_sheet['liabilities']['total_liabilities'] = str(balance_sheet['liabilities']['total_liabilities'])
            balance_sheet['equity']['total_equity'] = str(balance_sheet['equity']['total_equity'])
            
            # Calculate total liabilities and equity
            total_liab_equity = (
                Decimal(balance_sheet['liabilities']['total_liabilities']) +
                Decimal(balance_sheet['equity']['total_equity'])
            )
            balance_sheet['total_liabilities_and_equity'] = str(total_liab_equity)
            
            # Check if balance sheet balances
            balance_sheet['balanced'] = (
                balance_sheet['assets']['total_assets'] == 
                balance_sheet['total_liabilities_and_equity']
            )
            
            return {
                'success': True,
                'balance_sheet': balance_sheet
            }
            
        except Exception as e:
            logger.error(f"Error generating balance sheet: {str(e)}")
            return {
                'success': False,
                'error': 'INTERNAL_ERROR',
                'message': 'Failed to generate balance sheet'
            }
    
    @staticmethod
    def generate_income_statement(start_date: datetime, end_date: datetime, 
                                currency: str = 'USD') -> Dict:
        """
        Generate income statement (P&L) report
        
        Args:
            start_date: Report start date
            end_date: Report end date
            currency: Currency for the report
            
        Returns:
            Dict containing income statement
        """
        try:
            income_statement = {
                'start_date': start_date.isoformat() + 'Z',
                'end_date': end_date.isoformat() + 'Z',
                'currency': currency,
                'revenue': {
                    'revenue_accounts': [],
                    'total_revenue': Decimal('0.00')
                },
                'expenses': {
                    'expense_accounts': [],
                    'total_expenses': Decimal('0.00')
                },
                'net_income': Decimal('0.00')
            }
            
            # Get revenue and expense account balances for the period
            for account_name, account_info in LedgerService.CHART_OF_ACCOUNTS.items():
                if account_info['type'] in [AccountType.REVENUE, AccountType.EXPENSE]:
                    # Calculate period activity
                    query = LedgerEntry.query.filter(
                        LedgerEntry.account_name == account_name,
                        LedgerEntry.currency == currency,
                        LedgerEntry.created_at >= start_date,
                        LedgerEntry.created_at <= end_date
                    )
                    
                    if account_info['type'] == AccountType.REVENUE:
                        # Revenue: credits increase, debits decrease
                        balance_query = query.with_entities(
                            func.sum(LedgerEntry.credit_amount - LedgerEntry.debit_amount).label('balance')
                        )
                    else:
                        # Expenses: debits increase, credits decrease
                        balance_query = query.with_entities(
                            func.sum(LedgerEntry.debit_amount - LedgerEntry.credit_amount).label('balance')
                        )
                    
                    result = balance_query.first()
                    balance = result.balance if result.balance else Decimal('0.00')
                    
                    account_data = {
                        'account_name': account_name,
                        'account_display_name': account_info['name'],
                        'amount': str(balance)
                    }
                    
                    if account_info['type'] == AccountType.REVENUE:
                        income_statement['revenue']['revenue_accounts'].append(account_data)
                        income_statement['revenue']['total_revenue'] += balance
                    else:
                        income_statement['expenses']['expense_accounts'].append(account_data)
                        income_statement['expenses']['total_expenses'] += balance
            
            # Calculate net income
            income_statement['net_income'] = (
                income_statement['revenue']['total_revenue'] - 
                income_statement['expenses']['total_expenses']
            )
            
            # Convert to strings
            income_statement['revenue']['total_revenue'] = str(income_statement['revenue']['total_revenue'])
            income_statement['expenses']['total_expenses'] = str(income_statement['expenses']['total_expenses'])
            income_statement['net_income'] = str(income_statement['net_income'])
            
            return {
                'success': True,
                'income_statement': income_statement
            }
            
        except Exception as e:
            logger.error(f"Error generating income statement: {str(e)}")
            return {
                'success': False,
                'error': 'INTERNAL_ERROR',
                'message': 'Failed to generate income statement'
            }
    
    @staticmethod
    def reconcile_account(account_name: str, external_balance: Decimal, 
                         currency: str, as_of_date: datetime = None) -> Dict:
        """
        Reconcile internal account balance with external source
        
        Args:
            account_name: Account to reconcile
            external_balance: Balance from external source
            currency: Currency
            as_of_date: Reconciliation date
            
        Returns:
            Dict containing reconciliation result
        """
        try:
            if not as_of_date:
                as_of_date = datetime.now(timezone.utc)
            
            # Get internal balance
            balance_result = LedgerService.get_account_balance(
                account_name=account_name,
                currency=currency,
                as_of_date=as_of_date
            )
            
            if not balance_result['success']:
                return balance_result
            
            internal_balance = Decimal(balance_result['balance'])
            difference = internal_balance - external_balance
            
            reconciliation = {
                'account_name': account_name,
                'currency': currency,
                'as_of_date': as_of_date.isoformat() + 'Z',
                'internal_balance': str(internal_balance),
                'external_balance': str(external_balance),
                'difference': str(difference),
                'reconciled': difference == 0,
                'variance_percentage': float((difference / external_balance * 100) if external_balance != 0 else 0)
            }
            
            # Log reconciliation
            log_audit_event(
                user_id=getattr(g, 'user_id', None),
                action='ACCOUNT_RECONCILIATION',
                resource_type='reconciliation',
                resource_id=str(uuid.uuid4()),
                details=reconciliation
            )
            
            return {
                'success': True,
                'reconciliation': reconciliation
            }
            
        except Exception as e:
            logger.error(f"Error reconciling account: {str(e)}")
            return {
                'success': False,
                'error': 'INTERNAL_ERROR',
                'message': 'Failed to reconcile account'
            }

# API Routes
@enhanced_ledger_bp.route('/journal-entry', methods=['POST'])
@limiter.limit("20 per minute")
def create_journal_entry():
    """Create a journal entry"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['transaction_id', 'entries']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': 'MISSING_REQUIRED_FIELD',
                    'message': f'Missing required field: {field}'
                }), 400
        
        result = LedgerService.create_journal_entry(
            transaction_id=data['transaction_id'],
            entries=data['entries'],
            description=data.get('description'),
            reference=data.get('reference')
        )
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in create_journal_entry endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'INTERNAL_ERROR',
            'message': 'An unexpected error occurred'
        }), 500

@enhanced_ledger_bp.route('/account/<account_name>/balance', methods=['GET'])
@limiter.limit("50 per minute")
def get_account_balance(account_name):
    """Get account balance"""
    try:
        currency = request.args.get('currency')
        as_of_date_str = request.args.get('as_of_date')
        
        as_of_date = None
        if as_of_date_str:
            as_of_date = datetime.fromisoformat(as_of_date_str.replace('Z', '+00:00'))
        
        result = LedgerService.get_account_balance(
            account_name=account_name,
            currency=currency,
            as_of_date=as_of_date
        )
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in get_account_balance endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'INTERNAL_ERROR',
            'message': 'An unexpected error occurred'
        }), 500

@enhanced_ledger_bp.route('/reports/trial-balance', methods=['GET'])
@limiter.limit("10 per minute")
def generate_trial_balance():
    """Generate trial balance report"""
    try:
        currency = request.args.get('currency', 'USD')
        as_of_date_str = request.args.get('as_of_date')
        
        as_of_date = None
        if as_of_date_str:
            as_of_date = datetime.fromisoformat(as_of_date_str.replace('Z', '+00:00'))
        
        result = LedgerService.generate_trial_balance(
            as_of_date=as_of_date,
            currency=currency
        )
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in generate_trial_balance endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'INTERNAL_ERROR',
            'message': 'An unexpected error occurred'
        }), 500

@enhanced_ledger_bp.route('/reports/balance-sheet', methods=['GET'])
@limiter.limit("10 per minute")
def generate_balance_sheet():
    """Generate balance sheet report"""
    try:
        currency = request.args.get('currency', 'USD')
        as_of_date_str = request.args.get('as_of_date')
        
        as_of_date = None
        if as_of_date_str:
            as_of_date = datetime.fromisoformat(as_of_date_str.replace('Z', '+00:00'))
        
        result = LedgerService.generate_balance_sheet(
            as_of_date=as_of_date,
            currency=currency
        )
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in generate_balance_sheet endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'INTERNAL_ERROR',
            'message': 'An unexpected error occurred'
        }), 500

@enhanced_ledger_bp.route('/reports/income-statement', methods=['GET'])
@limiter.limit("10 per minute")
def generate_income_statement():
    """Generate income statement report"""
    try:
        currency = request.args.get('currency', 'USD')
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        
        if not start_date_str or not end_date_str:
            return jsonify({
                'success': False,
                'error': 'MISSING_DATE_RANGE',
                'message': 'Both start_date and end_date are required'
            }), 400
        
        start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
        
        result = LedgerService.generate_income_statement(
            start_date=start_date,
            end_date=end_date,
            currency=currency
        )
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in generate_income_statement endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'INTERNAL_ERROR',
            'message': 'An unexpected error occurred'
        }), 500


"""
Payment routes for MVP functionality
"""

from flask import Blueprint, request, jsonify, g
from src.models.database import db, User, Wallet, Transaction
from src.models.account import Account, AccountType, AccountStatus
from src.models.transaction import Transaction as EnhancedTransaction, TransactionType, TransactionStatus, TransactionCategory
from datetime import datetime, timezone
import uuid
from decimal import Decimal
from functools import wraps
import logging

# Create blueprint
payment_mvp_bp = Blueprint('payment_mvp', __name__, url_prefix='/api/v1/payment')

# Configure logging
logger = logging.getLogger(__name__)

def validate_json_request(required_fields=None):
    """Decorator to validate JSON request data"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                return jsonify({
                    'error': 'Content-Type must be application/json',
                    'code': 'INVALID_CONTENT_TYPE'
                }), 400
            
            data = request.get_json()
            if not data:
                return jsonify({
                    'error': 'Request body must contain valid JSON',
                    'code': 'INVALID_JSON'
                }), 400
            
            if required_fields:
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    return jsonify({
                        'error': f'Missing required fields: {", ".join(missing_fields)}',
                        'code': 'MISSING_FIELDS',
                        'missing_fields': missing_fields
                    }), 400
            
            g.request_data = data
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@payment_mvp_bp.route('/transfer', methods=['POST'])
@validate_json_request(['from_wallet_id', 'to_wallet_id', 'amount'])
def transfer_funds():
    """
    Transfer funds between wallets
    
    Expected JSON payload:
    {
        "from_wallet_id": "string",
        "to_wallet_id": "string",
        "amount": "decimal",
        "description": "string" (optional),
        "reference": "string" (optional)
    }
    """
    try:
        data = g.request_data
        
        # Find source and destination accounts
        from_account = Account.query.get(data['from_wallet_id'])
        to_account = Account.query.get(data['to_wallet_id'])
        
        if not from_account:
            return jsonify({
                'error': 'Source wallet not found',
                'code': 'SOURCE_WALLET_NOT_FOUND'
            }), 404
        
        if not to_account:
            return jsonify({
                'error': 'Destination wallet not found',
                'code': 'DESTINATION_WALLET_NOT_FOUND'
            }), 404
        
        # Validate account statuses
        if from_account.status != AccountStatus.ACTIVE:
            return jsonify({
                'error': 'Source wallet is not active',
                'code': 'SOURCE_WALLET_INACTIVE'
            }), 400
        
        if to_account.status != AccountStatus.ACTIVE:
            return jsonify({
                'error': 'Destination wallet is not active',
                'code': 'DESTINATION_WALLET_INACTIVE'
            }), 400
        
        # Validate amount
        try:
            amount = Decimal(str(data['amount']))
            if amount <= 0:
                return jsonify({
                    'error': 'Transfer amount must be positive',
                    'code': 'INVALID_AMOUNT'
                }), 400
        except (ValueError, TypeError):
            return jsonify({
                'error': 'Invalid amount format',
                'code': 'INVALID_AMOUNT_FORMAT'
            }), 400
        
        # Check currency compatibility
        if from_account.currency != to_account.currency:
            return jsonify({
                'error': 'Currency mismatch between wallets',
                'code': 'CURRENCY_MISMATCH',
                'from_currency': from_account.currency,
                'to_currency': to_account.currency
            }), 400
        
        # Check if source account has sufficient funds
        can_debit, message = from_account.can_debit(amount)
        if not can_debit:
            return jsonify({
                'error': message,
                'code': 'INSUFFICIENT_FUNDS'
            }), 400
        
        # Check daily/monthly limits for source account
        within_limits, limit_message = from_account.check_limits(amount, 'daily')
        if not within_limits:
            return jsonify({
                'error': limit_message,
                'code': 'DAILY_LIMIT_EXCEEDED'
            }), 400
        
        # Generate transfer reference
        transfer_reference = data.get('reference', f"TRF-{datetime.now().strftime('%Y%m%d%H%M%S')}-{str(uuid.uuid4())[:8]}")
        description = data.get('description', f'Transfer from {from_account.account_name} to {to_account.account_name}')
        
        # Create debit transaction for source account
        debit_transaction = EnhancedTransaction(
            user_id=from_account.user_id,
            account_id=from_account.id,
            transaction_type=TransactionType.DEBIT,
            transaction_category=TransactionCategory.TRANSFER,
            status=TransactionStatus.COMPLETED,
            description=f'{description} (Outgoing)',
            reference_number=transfer_reference,
            channel='api'
        )
        debit_transaction.set_amount(amount)
        debit_transaction.currency = from_account.currency
        debit_transaction.processed_at = datetime.now(timezone.utc)
        
        # Create credit transaction for destination account
        credit_transaction = EnhancedTransaction(
            user_id=to_account.user_id,
            account_id=to_account.id,
            transaction_type=TransactionType.CREDIT,
            transaction_category=TransactionCategory.TRANSFER,
            status=TransactionStatus.COMPLETED,
            description=f'{description} (Incoming)',
            reference_number=transfer_reference,
            channel='api'
        )
        credit_transaction.set_amount(amount)
        credit_transaction.currency = to_account.currency
        credit_transaction.processed_at = datetime.now(timezone.utc)
        
        # Link transactions as related
        credit_transaction.parent_transaction_id = debit_transaction.id
        
        # Update account balances
        from_account.debit(amount, debit_transaction.description)
        to_account.credit(amount, credit_transaction.description)
        
        # Save all changes
        db.session.add(debit_transaction)
        db.session.add(credit_transaction)
        db.session.commit()
        
        logger.info(f"Transfer completed: {amount} {from_account.currency} from {from_account.id} to {to_account.id}")
        
        return jsonify({
            'success': True,
            'transfer_reference': transfer_reference,
            'from_wallet': {
                'wallet_id': str(from_account.id),
                'account_name': from_account.account_name,
                'new_balance': float(from_account.get_available_balance_decimal())
            },
            'to_wallet': {
                'wallet_id': str(to_account.id),
                'account_name': to_account.account_name,
                'new_balance': float(to_account.get_available_balance_decimal())
            },
            'transfer_details': {
                'amount': float(amount),
                'currency': from_account.currency,
                'description': description,
                'processed_at': debit_transaction.processed_at.isoformat()
            },
            'transactions': {
                'debit_transaction_id': str(debit_transaction.id),
                'credit_transaction_id': str(credit_transaction.id)
            },
            'message': 'Transfer completed successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error processing transfer: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'code': 'INTERNAL_ERROR'
        }), 500

@payment_mvp_bp.route('/send', methods=['POST'])
@validate_json_request(['from_wallet_id', 'recipient_identifier', 'amount'])
def send_payment():
    """
    Send payment to a recipient (by email, phone, or account number)
    
    Expected JSON payload:
    {
        "from_wallet_id": "string",
        "recipient_identifier": "string", // email, phone, or account number
        "recipient_type": "email|phone|account_number" (optional, auto-detected),
        "amount": "decimal",
        "description": "string" (optional),
        "reference": "string" (optional)
    }
    """
    try:
        data = g.request_data
        
        # Find source account
        from_account = Account.query.get(data['from_wallet_id'])
        if not from_account:
            return jsonify({
                'error': 'Source wallet not found',
                'code': 'SOURCE_WALLET_NOT_FOUND'
            }), 404
        
        # Validate source account status
        if from_account.status != AccountStatus.ACTIVE:
            return jsonify({
                'error': 'Source wallet is not active',
                'code': 'SOURCE_WALLET_INACTIVE'
            }), 400
        
        # Find recipient account
        recipient_identifier = data['recipient_identifier']
        recipient_type = data.get('recipient_type', 'auto')
        
        # Auto-detect recipient type if not specified
        if recipient_type == 'auto':
            if '@' in recipient_identifier:
                recipient_type = 'email'
            elif recipient_identifier.isdigit() and len(recipient_identifier) >= 10:
                if len(recipient_identifier) == 16:  # Account number length
                    recipient_type = 'account_number'
                else:
                    recipient_type = 'phone'
            else:
                recipient_type = 'account_number'
        
        # Find recipient account based on type
        to_account = None
        if recipient_type == 'email':
            # Find user by email, then get their primary account
            user = User.query.filter_by(email=recipient_identifier).first()
            if user:
                to_account = Account.query.filter_by(user_id=user.id).first()
        elif recipient_type == 'phone':
            # Find user by phone, then get their primary account
            user = User.query.filter_by(phone=recipient_identifier).first()
            if user:
                to_account = Account.query.filter_by(user_id=user.id).first()
        elif recipient_type == 'account_number':
            # Find account by account number
            to_account = Account.query.filter_by(account_number=recipient_identifier).first()
        
        if not to_account:
            return jsonify({
                'error': 'Recipient not found',
                'code': 'RECIPIENT_NOT_FOUND',
                'recipient_identifier': recipient_identifier,
                'recipient_type': recipient_type
            }), 404
        
        # Validate destination account status
        if to_account.status != AccountStatus.ACTIVE:
            return jsonify({
                'error': 'Recipient wallet is not active',
                'code': 'RECIPIENT_WALLET_INACTIVE'
            }), 400
        
        # Validate amount
        try:
            amount = Decimal(str(data['amount']))
            if amount <= 0:
                return jsonify({
                    'error': 'Payment amount must be positive',
                    'code': 'INVALID_AMOUNT'
                }), 400
        except (ValueError, TypeError):
            return jsonify({
                'error': 'Invalid amount format',
                'code': 'INVALID_AMOUNT_FORMAT'
            }), 400
        
        # Check currency compatibility
        if from_account.currency != to_account.currency:
            return jsonify({
                'error': 'Currency mismatch between wallets',
                'code': 'CURRENCY_MISMATCH',
                'from_currency': from_account.currency,
                'to_currency': to_account.currency
            }), 400
        
        # Check if source account has sufficient funds
        can_debit, message = from_account.can_debit(amount)
        if not can_debit:
            return jsonify({
                'error': message,
                'code': 'INSUFFICIENT_FUNDS'
            }), 400
        
        # Check daily/monthly limits for source account
        within_limits, limit_message = from_account.check_limits(amount, 'daily')
        if not within_limits:
            return jsonify({
                'error': limit_message,
                'code': 'DAILY_LIMIT_EXCEEDED'
            }), 400
        
        # Generate payment reference
        payment_reference = data.get('reference', f"PAY-{datetime.now().strftime('%Y%m%d%H%M%S')}-{str(uuid.uuid4())[:8]}")
        description = data.get('description', f'Payment to {recipient_identifier}')
        
        # Create debit transaction for source account
        debit_transaction = EnhancedTransaction(
            user_id=from_account.user_id,
            account_id=from_account.id,
            transaction_type=TransactionType.PAYMENT,
            transaction_category=TransactionCategory.PAYMENT,
            status=TransactionStatus.COMPLETED,
            description=f'{description} (Sent)',
            reference_number=payment_reference,
            channel='api'
        )
        debit_transaction.set_amount(amount)
        debit_transaction.currency = from_account.currency
        debit_transaction.processed_at = datetime.now(timezone.utc)
        
        # Create credit transaction for destination account
        credit_transaction = EnhancedTransaction(
            user_id=to_account.user_id,
            account_id=to_account.id,
            transaction_type=TransactionType.PAYMENT,
            transaction_category=TransactionCategory.PAYMENT,
            status=TransactionStatus.COMPLETED,
            description=f'{description} (Received)',
            reference_number=payment_reference,
            channel='api'
        )
        credit_transaction.set_amount(amount)
        credit_transaction.currency = to_account.currency
        credit_transaction.processed_at = datetime.now(timezone.utc)
        
        # Link transactions as related
        credit_transaction.parent_transaction_id = debit_transaction.id
        
        # Update account balances
        from_account.debit(amount, debit_transaction.description)
        to_account.credit(amount, credit_transaction.description)
        
        # Save all changes
        db.session.add(debit_transaction)
        db.session.add(credit_transaction)
        db.session.commit()
        
        logger.info(f"Payment completed: {amount} {from_account.currency} from {from_account.id} to {to_account.id}")
        
        return jsonify({
            'success': True,
            'payment_reference': payment_reference,
            'sender': {
                'wallet_id': str(from_account.id),
                'account_name': from_account.account_name,
                'new_balance': float(from_account.get_available_balance_decimal())
            },
            'recipient': {
                'wallet_id': str(to_account.id),
                'account_name': to_account.account_name,
                'identifier': recipient_identifier,
                'type': recipient_type
            },
            'payment_details': {
                'amount': float(amount),
                'currency': from_account.currency,
                'description': description,
                'processed_at': debit_transaction.processed_at.isoformat()
            },
            'transactions': {
                'debit_transaction_id': str(debit_transaction.id),
                'credit_transaction_id': str(credit_transaction.id)
            },
            'message': 'Payment sent successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error processing payment: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'code': 'INTERNAL_ERROR'
        }), 500

@payment_mvp_bp.route('/request', methods=['POST'])
@validate_json_request(['from_wallet_id', 'amount'])
def request_payment():
    """
    Create a payment request (for future implementation)
    
    Expected JSON payload:
    {
        "from_wallet_id": "string",
        "amount": "decimal",
        "description": "string" (optional),
        "expires_at": "datetime" (optional)
    }
    """
    try:
        data = g.request_data
        
        # Find account
        account = Account.query.get(data['from_wallet_id'])
        if not account:
            return jsonify({
                'error': 'Wallet not found',
                'code': 'WALLET_NOT_FOUND'
            }), 404
        
        # Validate amount
        try:
            amount = Decimal(str(data['amount']))
            if amount <= 0:
                return jsonify({
                    'error': 'Request amount must be positive',
                    'code': 'INVALID_AMOUNT'
                }), 400
        except (ValueError, TypeError):
            return jsonify({
                'error': 'Invalid amount format',
                'code': 'INVALID_AMOUNT_FORMAT'
            }), 400
        
        # Generate request reference
        request_reference = f"REQ-{datetime.now().strftime('%Y%m%d%H%M%S')}-{str(uuid.uuid4())[:8]}"
        description = data.get('description', 'Payment request')
        
        # For MVP, we'll just return the request details
        # In a full implementation, this would be stored in a payment_requests table
        
        return jsonify({
            'success': True,
            'request_reference': request_reference,
            'wallet_id': str(account.id),
            'account_name': account.account_name,
            'amount': float(amount),
            'currency': account.currency,
            'description': description,
            'status': 'pending',
            'created_at': datetime.now(timezone.utc).isoformat(),
            'expires_at': data.get('expires_at'),
            'message': 'Payment request created successfully'
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating payment request: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'code': 'INTERNAL_ERROR'
        }), 500

@payment_mvp_bp.route('/history/<wallet_id>', methods=['GET'])
def get_payment_history(wallet_id):
    """
    Get payment history for a wallet (payments sent and received)
    
    Query parameters:
    - page: Page number (default: 1)
    - per_page: Items per page (default: 20, max: 100)
    - type: Filter by type (sent, received, all) (default: all)
    - start_date: Filter from date (ISO format)
    - end_date: Filter to date (ISO format)
    """
    try:
        # Find account
        account = Account.query.get(wallet_id)
        if not account:
            return jsonify({
                'error': 'Wallet not found',
                'code': 'WALLET_NOT_FOUND'
            }), 404
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        payment_type = request.args.get('type', 'all').lower()
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Build query for payment transactions
        query = EnhancedTransaction.query.filter_by(account_id=wallet_id).filter(
            EnhancedTransaction.transaction_category.in_([TransactionCategory.PAYMENT, TransactionCategory.TRANSFER])
        )
        
        # Apply type filter
        if payment_type == 'sent':
            query = query.filter(EnhancedTransaction.transaction_type == TransactionType.DEBIT)
        elif payment_type == 'received':
            query = query.filter(EnhancedTransaction.transaction_type == TransactionType.CREDIT)
        elif payment_type != 'all':
            return jsonify({
                'error': 'Invalid type. Must be one of: sent, received, all',
                'code': 'INVALID_TYPE'
            }), 400
        
        # Apply date filters
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                query = query.filter(EnhancedTransaction.created_at >= start_dt)
            except ValueError:
                return jsonify({
                    'error': 'Invalid start_date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)',
                    'code': 'INVALID_DATE_FORMAT'
                }), 400
        
        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                query = query.filter(EnhancedTransaction.created_at <= end_dt)
            except ValueError:
                return jsonify({
                    'error': 'Invalid end_date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)',
                    'code': 'INVALID_DATE_FORMAT'
                }), 400
        
        # Order by creation date (newest first) and paginate
        payments = query.order_by(EnhancedTransaction.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # Format payment data
        payment_list = []
        for payment in payments.items:
            payment_data = payment.to_dict()
            payment_data['direction'] = 'sent' if payment.transaction_type == TransactionType.DEBIT else 'received'
            payment_list.append(payment_data)
        
        return jsonify({
            'success': True,
            'wallet_id': wallet_id,
            'payments': payment_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': payments.total,
                'pages': payments.pages,
                'has_next': payments.has_next,
                'has_prev': payments.has_prev
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting payment history: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'code': 'INTERNAL_ERROR'
        }), 500

# Error handlers for the blueprint
@payment_mvp_bp.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint not found',
        'code': 'ENDPOINT_NOT_FOUND'
    }), 404

@payment_mvp_bp.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        'error': 'Method not allowed',
        'code': 'METHOD_NOT_ALLOWED'
    }), 405

@payment_mvp_bp.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal server error',
        'code': 'INTERNAL_ERROR'
    }), 500


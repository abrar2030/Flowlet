"""
Flask Routes for Banking Integrations
Provides REST API endpoints for banking integration functionality
"""

from flask import Blueprint, request, jsonify, current_app
from flask_cors import cross_origin
import asyncio
import logging
from typing import Dict, Any, List
from datetime import datetime

from ..integrations.banking.manager import banking_manager, IntegrationType
from ..integrations.banking import (
    BankingIntegrationError,
    AuthenticationError,
    InvalidAccountError,
    PaymentRequest
)

logger = logging.getLogger(__name__)

# Create blueprint
banking_bp = Blueprint('banking', __name__, url_prefix='/api/v1/banking')


@banking_bp.route('/integrations', methods=['GET'])
@cross_origin()
def list_integrations():
    """List all registered banking integrations"""
    try:
        integrations = banking_manager.list_integrations()
        health_status = banking_manager.get_integration_health()
        
        return jsonify({
            'success': True,
            'integrations': integrations,
            'health_status': health_status
        }), 200
        
    except Exception as e:
        logger.error(f"Failed to list integrations: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@banking_bp.route('/integrations', methods=['POST'])
@cross_origin()
def register_integration():
    """Register a new banking integration"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'type', 'config']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Validate integration type
        try:
            integration_type = IntegrationType(data['type'])
        except ValueError:
            return jsonify({
                'success': False,
                'error': f'Invalid integration type: {data["type"]}'
            }), 400
        
        # Register integration
        banking_manager.register_integration(
            data['name'],
            integration_type,
            data['config']
        )
        
        return jsonify({
            'success': True,
            'message': f'Integration {data["name"]} registered successfully'
        }), 201
        
    except BankingIntegrationError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        logger.error(f"Failed to register integration: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@banking_bp.route('/integrations/authenticate', methods=['POST'])
@cross_origin()
def authenticate_integrations():
    """Authenticate all registered integrations"""
    try:
        # Run async authentication
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        results = loop.run_until_complete(banking_manager.authenticate_all())
        loop.close()
        
        return jsonify({
            'success': True,
            'authentication_results': results
        }), 200
        
    except Exception as e:
        logger.error(f"Authentication failed: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@banking_bp.route('/accounts/<customer_id>', methods=['GET'])
@cross_origin()
def get_customer_accounts(customer_id: str):
    """Get accounts for a customer from all integrations"""
    try:
        # Run async account retrieval
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        accounts_by_integration = loop.run_until_complete(
            banking_manager.get_accounts_from_all(customer_id)
        )
        loop.close()
        
        # Convert account objects to dictionaries
        serialized_accounts = {}
        for integration_name, accounts in accounts_by_integration.items():
            serialized_accounts[integration_name] = [
                {
                    'account_id': acc.account_id,
                    'account_number': acc.account_number,
                    'routing_number': acc.routing_number,
                    'account_type': acc.account_type,
                    'bank_name': acc.bank_name,
                    'currency': acc.currency,
                    'balance': acc.balance,
                    'available_balance': acc.available_balance,
                    'account_holder_name': acc.account_holder_name,
                    'iban': acc.iban,
                    'swift_code': acc.swift_code
                }
                for acc in accounts
            ]
        
        return jsonify({
            'success': True,
            'customer_id': customer_id,
            'accounts': serialized_accounts
        }), 200
        
    except Exception as e:
        logger.error(f"Failed to get accounts: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@banking_bp.route('/transactions', methods=['POST'])
@cross_origin()
def get_transactions():
    """Get transactions from multiple integrations"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if 'account_mappings' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required field: account_mappings'
            }), 400
        
        account_mappings = data['account_mappings']
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        limit = data.get('limit')
        
        # Parse dates if provided
        if start_date:
            start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        if end_date:
            end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        # Run async transaction retrieval
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        transactions_by_integration = loop.run_until_complete(
            banking_manager.get_all_transactions(
                account_mappings, start_date, end_date, limit
            )
        )
        loop.close()
        
        # Convert transaction objects to dictionaries
        serialized_transactions = {}
        for integration_name, transactions in transactions_by_integration.items():
            serialized_transactions[integration_name] = [
                {
                    'transaction_id': txn.transaction_id,
                    'account_id': txn.account_id,
                    'amount': txn.amount,
                    'currency': txn.currency,
                    'transaction_type': txn.transaction_type.value,
                    'status': txn.status.value,
                    'description': txn.description,
                    'timestamp': txn.timestamp.isoformat(),
                    'reference_id': txn.reference_id,
                    'counterparty_account': txn.counterparty_account,
                    'counterparty_name': txn.counterparty_name,
                    'fees': txn.fees,
                    'exchange_rate': txn.exchange_rate,
                    'metadata': txn.metadata
                }
                for txn in transactions
            ]
        
        return jsonify({
            'success': True,
            'transactions': serialized_transactions
        }), 200
        
    except Exception as e:
        logger.error(f"Failed to get transactions: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@banking_bp.route('/payments', methods=['POST'])
@cross_origin()
def initiate_payment():
    """Initiate a payment with fallback to multiple integrations"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['amount', 'currency', 'from_account', 'to_account', 'description']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Create payment request
        payment_request = PaymentRequest(
            amount=float(data['amount']),
            currency=data['currency'],
            from_account=data['from_account'],
            to_account=data['to_account'],
            description=data['description'],
            reference_id=data.get('reference_id'),
            scheduled_date=datetime.fromisoformat(data['scheduled_date'].replace('Z', '+00:00')) 
                if data.get('scheduled_date') else None,
            metadata=data.get('metadata')
        )
        
        preferred_integrations = data.get('preferred_integrations')
        
        # Run async payment initiation
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        transaction_id, integration_name = loop.run_until_complete(
            banking_manager.initiate_payment_with_fallback(
                payment_request, preferred_integrations
            )
        )
        loop.close()
        
        return jsonify({
            'success': True,
            'transaction_id': transaction_id,
            'integration_used': integration_name,
            'payment_request': {
                'amount': payment_request.amount,
                'currency': payment_request.currency,
                'from_account': payment_request.from_account,
                'to_account': payment_request.to_account,
                'description': payment_request.description,
                'reference_id': payment_request.reference_id
            }
        }), 201
        
    except BankingIntegrationError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        logger.error(f"Payment initiation failed: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@banking_bp.route('/payments/status', methods=['POST'])
@cross_origin()
def get_payment_status():
    """Get payment status from multiple integrations"""
    try:
        data = request.get_json()
        
        if 'transaction_mappings' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required field: transaction_mappings'
            }), 400
        
        transaction_mappings = data['transaction_mappings']
        
        # Run async status retrieval
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        status_results = loop.run_until_complete(
            banking_manager.get_payment_status_multi(transaction_mappings)
        )
        loop.close()
        
        # Convert status enums to strings
        serialized_status = {
            integration: status.value
            for integration, status in status_results.items()
        }
        
        return jsonify({
            'success': True,
            'payment_status': serialized_status
        }), 200
        
    except Exception as e:
        logger.error(f"Failed to get payment status: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@banking_bp.route('/health', methods=['GET'])
@cross_origin()
def health_check():
    """Health check endpoint for banking integrations"""
    try:
        health_status = banking_manager.get_integration_health()
        
        # Determine overall health
        all_healthy = all(
            status.get('authenticated', False) 
            for status in health_status.values()
        )
        
        return jsonify({
            'success': True,
            'overall_health': 'healthy' if all_healthy else 'degraded',
            'integrations': health_status,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# Error handlers
@banking_bp.errorhandler(AuthenticationError)
def handle_auth_error(e):
    return jsonify({
        'success': False,
        'error': 'Authentication failed',
        'details': str(e)
    }), 401


@banking_bp.errorhandler(InvalidAccountError)
def handle_invalid_account_error(e):
    return jsonify({
        'success': False,
        'error': 'Invalid account',
        'details': str(e)
    }), 404


@banking_bp.errorhandler(BankingIntegrationError)
def handle_banking_error(e):
    return jsonify({
        'success': False,
        'error': 'Banking integration error',
        'details': str(e)
    }), 400


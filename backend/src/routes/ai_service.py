from flask import Blueprint, request, jsonify
from src.models.database import db, FraudAlert, Transaction, User
from datetime import datetime, timedelta
import random
import string

ai_bp = Blueprint('ai_service', __name__)

def generate_alert_id():
    """Generate a unique alert ID"""
    return 'ALERT_' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

@ai_bp.route('/fraud-detection/analyze', methods=['POST'])
def analyze_transaction_fraud():
    """Analyze a transaction for potential fraud using AI algorithms"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['transaction_id', 'user_id', 'amount', 'merchant_info']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        transaction_id = data['transaction_id']
        user_id = data['user_id']
        amount = float(data['amount'])
        merchant_info = data['merchant_info']
        
        # Get user and transaction history for analysis
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get recent transaction history for pattern analysis
        recent_transactions = Transaction.query.filter_by(wallet_id=data.get('wallet_id'))\
            .filter(Transaction.created_at >= datetime.utcnow() - timedelta(days=30))\
            .order_by(Transaction.created_at.desc()).limit(50).all()
        
        # AI Fraud Detection Algorithm Simulation
        risk_factors = []
        risk_score = 0
        
        # 1. Amount-based analysis
        if recent_transactions:
            avg_amount = sum(float(t.amount) for t in recent_transactions) / len(recent_transactions)
            if amount > avg_amount * 5:  # 5x average transaction
                risk_score += 30
                risk_factors.append('unusually_high_amount')
            elif amount > avg_amount * 3:  # 3x average transaction
                risk_score += 15
                risk_factors.append('high_amount')
        
        # 2. Velocity analysis
        recent_count = len([t for t in recent_transactions 
                           if t.created_at >= datetime.utcnow() - timedelta(hours=1)])
        if recent_count > 10:  # More than 10 transactions in last hour
            risk_score += 40
            risk_factors.append('high_velocity')
        elif recent_count > 5:
            risk_score += 20
            risk_factors.append('moderate_velocity')
        
        # 3. Geographic analysis (simulated)
        user_location = data.get('user_location', 'US')
        merchant_location = merchant_info.get('location', 'US')
        if user_location != merchant_location:
            risk_score += 25
            risk_factors.append('geographic_mismatch')
        
        # 4. Time-based analysis
        current_hour = datetime.utcnow().hour
        if current_hour < 6 or current_hour > 23:  # Late night transactions
            risk_score += 15
            risk_factors.append('unusual_time')
        
        # 5. Merchant category analysis
        merchant_category = merchant_info.get('category', 'unknown')
        high_risk_categories = ['gambling', 'adult_entertainment', 'cryptocurrency']
        if merchant_category in high_risk_categories:
            risk_score += 35
            risk_factors.append('high_risk_merchant')
        
        # 6. Device/IP analysis (simulated)
        if data.get('new_device', False):
            risk_score += 20
            risk_factors.append('new_device')
        
        if data.get('suspicious_ip', False):
            risk_score += 30
            risk_factors.append('suspicious_ip')
        
        # 7. Behavioral pattern analysis
        if recent_transactions:
            # Check for unusual spending patterns
            daily_amounts = {}
            for t in recent_transactions:
                date_key = t.created_at.date()
                if date_key not in daily_amounts:
                    daily_amounts[date_key] = 0
                daily_amounts[date_key] += float(t.amount)
            
            if daily_amounts:
                avg_daily = sum(daily_amounts.values()) / len(daily_amounts)
                today_amount = daily_amounts.get(datetime.utcnow().date(), 0) + amount
                
                if today_amount > avg_daily * 4:
                    risk_score += 25
                    risk_factors.append('unusual_daily_spending')
        
        # Determine risk level and action
        if risk_score >= 70:
            risk_level = 'high'
            recommended_action = 'block_transaction'
        elif risk_score >= 40:
            risk_level = 'medium'
            recommended_action = 'require_additional_verification'
        elif risk_score >= 20:
            risk_level = 'low'
            recommended_action = 'monitor'
        else:
            risk_level = 'very_low'
            recommended_action = 'approve'
        
        # Create fraud alert if risk is medium or high
        if risk_score >= 40:
            alert = FraudAlert(
                transaction_id=transaction_id,
                user_id=user_id,
                alert_type='suspicious_transaction',
                risk_score=risk_score,
                description=f"AI detected suspicious transaction: {', '.join(risk_factors)}",
                status='open'
            )
            db.session.add(alert)
            db.session.commit()
            alert_id = alert.id
        else:
            alert_id = None
        
        return jsonify({
            'transaction_id': transaction_id,
            'fraud_analysis': {
                'risk_score': risk_score,
                'risk_level': risk_level,
                'risk_factors': risk_factors,
                'recommended_action': recommended_action,
                'confidence': min(95, 60 + (risk_score // 5))  # Confidence increases with risk score
            },
            'alert_created': alert_id is not None,
            'alert_id': alert_id,
            'analysis_timestamp': datetime.utcnow().isoformat(),
            'model_version': 'FlowletAI-FraudDetection-v2.1'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/fraud-detection/alerts', methods=['GET'])
def get_fraud_alerts():
    """Get fraud alerts with filtering"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status')
        risk_level = request.args.get('risk_level')
        user_id = request.args.get('user_id')
        
        # Build query
        query = FraudAlert.query
        
        if status:
            query = query.filter(FraudAlert.status == status)
        
        if user_id:
            query = query.filter(FraudAlert.user_id == user_id)
        
        if risk_level:
            if risk_level == 'high':
                query = query.filter(FraudAlert.risk_score >= 70)
            elif risk_level == 'medium':
                query = query.filter(FraudAlert.risk_score.between(40, 69))
            elif risk_level == 'low':
                query = query.filter(FraudAlert.risk_score.between(20, 39))
            elif risk_level == 'very_low':
                query = query.filter(FraudAlert.risk_score < 20)
        
        # Execute query with pagination
        alerts = query.order_by(FraudAlert.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        alert_list = []
        for alert in alerts.items:
            alert_list.append({
                'alert_id': alert.id,
                'transaction_id': alert.transaction_id,
                'user_id': alert.user_id,
                'alert_type': alert.alert_type,
                'risk_score': alert.risk_score,
                'description': alert.description,
                'status': alert.status,
                'created_at': alert.created_at.isoformat(),
                'resolved_at': alert.resolved_at.isoformat() if alert.resolved_at else None
            })
        
        return jsonify({
            'alerts': alert_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': alerts.total,
                'pages': alerts.pages,
                'has_next': alerts.has_next,
                'has_prev': alerts.has_prev
            },
            'filters_applied': {
                'status': status,
                'risk_level': risk_level,
                'user_id': user_id
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/fraud-detection/alerts/<alert_id>/resolve', methods=['POST'])
def resolve_fraud_alert(alert_id):
    """Resolve a fraud alert"""
    try:
        data = request.get_json()
        
        alert = FraudAlert.query.get(alert_id)
        if not alert:
            return jsonify({'error': 'Alert not found'}), 404
        
        resolution = data.get('resolution', 'resolved')
        notes = data.get('notes', '')
        
        if resolution not in ['resolved', 'false_positive', 'investigating']:
            return jsonify({'error': 'Invalid resolution status'}), 400
        
        alert.status = resolution
        alert.resolved_at = datetime.utcnow()
        if notes:
            alert.description += f" | Resolution notes: {notes}"
        
        db.session.commit()
        
        return jsonify({
            'alert_id': alert.id,
            'status': alert.status,
            'resolved_at': alert.resolved_at.isoformat(),
            'message': 'Alert resolved successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/chatbot/query', methods=['POST'])
def chatbot_query():
    """AI Support Chatbot for developer and user assistance"""
    try:
        data = request.get_json()
        
        if 'query' not in data:
            return jsonify({'error': 'Missing required field: query'}), 400
        
        user_query = data['query'].lower()
        context = data.get('context', 'general')  # general, developer, user
        
        # Simple rule-based chatbot responses (in production, this would use NLP/LLM)
        responses = {
            # API Documentation queries
            'api': {
                'response': 'Flowlet provides comprehensive REST APIs for all financial services. Key endpoints include:\n\n• Wallet Management: /api/v1/wallet/\n• Payment Processing: /api/v1/payment/\n• Card Services: /api/v1/card/\n• KYC/AML: /api/v1/kyc/\n• Ledger: /api/v1/ledger/\n\nAll APIs use JSON format and require authentication. Check our developer portal for detailed documentation.',
                'confidence': 95
            },
            'authentication': {
                'response': 'Flowlet uses API key authentication. Include your API key in the Authorization header:\n\nAuthorization: Bearer YOUR_API_KEY\n\nAPI keys can be generated in the developer portal with specific permissions and rate limits.',
                'confidence': 90
            },
            'wallet': {
                'response': 'Wallet operations include:\n\n• Create wallet: POST /api/v1/wallet/create\n• Get balance: GET /api/v1/wallet/{id}/balance\n• Transfer funds: POST /api/v1/wallet/{id}/transfer\n• Transaction history: GET /api/v1/wallet/{id}/transactions\n\nWallets support multiple currencies and real-time balance updates.',
                'confidence': 95
            },
            'payment': {
                'response': 'Payment processing supports:\n\n• Deposits: POST /api/v1/payment/deposit\n• Withdrawals: POST /api/v1/payment/withdraw\n• Bank transfers: POST /api/v1/payment/bank-transfer\n• Card payments: POST /api/v1/payment/card-payment\n• Currency conversion: POST /api/v1/payment/currency-conversion\n\nAll payments are processed with real-time status updates.',
                'confidence': 95
            },
            'card': {
                'response': 'Card services include:\n\n• Issue virtual/physical cards: POST /api/v1/card/issue\n• Manage spending limits: PUT /api/v1/card/{id}/limits\n• Freeze/unfreeze cards: POST /api/v1/card/{id}/freeze\n• Transaction controls: PUT /api/v1/card/{id}/controls\n\nCards support real-time controls and spending analytics.',
                'confidence': 95
            },
            'kyc': {
                'response': 'KYC/AML compliance features:\n\n• User creation: POST /api/v1/kyc/user/create\n• Start verification: POST /api/v1/kyc/verification/start\n• Document submission: POST /api/v1/kyc/verification/{id}/document\n• AML screening: POST /api/v1/kyc/aml/screening\n\nSupports multiple verification levels: basic, enhanced, premium.',
                'confidence': 95
            },
            'error': {
                'response': 'Common error handling:\n\n• 400: Bad Request - Check required fields\n• 401: Unauthorized - Verify API key\n• 404: Not Found - Check resource ID\n• 500: Server Error - Contact support\n\nAll errors return JSON with error details and suggestions.',
                'confidence': 85
            },
            'rate limit': {
                'response': 'API rate limits:\n\n• Default: 1000 requests/hour per API key\n• Burst: Up to 100 requests/minute\n• Headers: X-RateLimit-Remaining, X-RateLimit-Reset\n\nContact support for higher limits or enterprise plans.',
                'confidence': 90
            },
            'webhook': {
                'response': 'Webhooks notify your application of events:\n\n• Transaction completed\n• Card transaction\n• KYC status change\n• Fraud alert\n\nConfigure webhook URLs in the developer portal with event filtering.',
                'confidence': 85
            },
            'sandbox': {
                'response': 'Sandbox environment for testing:\n\n• Base URL: https://sandbox-api.flowlet.com\n• Test data: Use test card numbers and bank accounts\n• No real money: All transactions are simulated\n• Reset data: Available in developer portal\n\nPerfect for integration testing before production.',
                'confidence': 90
            },
            'support': {
                'response': 'Get help:\n\n• Documentation: https://docs.flowlet.com\n• Developer Portal: https://developers.flowlet.com\n• Support Email: support@flowlet.com\n• Status Page: https://status.flowlet.com\n• Community Forum: https://community.flowlet.com\n\nFor urgent issues, use priority support in your dashboard.',
                'confidence': 95
            }
        }
        
        # Find best matching response
        best_match = None
        best_score = 0
        
        for keyword, response_data in responses.items():
            if keyword in user_query:
                score = response_data['confidence']
                if score > best_score:
                    best_match = response_data
                    best_score = score
        
        # Default response if no match found
        if not best_match:
            best_match = {
                'response': 'I can help you with Flowlet APIs and services. Try asking about:\n\n• API documentation and endpoints\n• Authentication and API keys\n• Wallet, payment, card, or KYC operations\n• Error handling and troubleshooting\n• Rate limits and webhooks\n• Sandbox testing\n\nWhat specific topic would you like to know about?',
                'confidence': 50
            }
        
        # Generate conversation ID for follow-up
        conversation_id = 'CONV_' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        
        return jsonify({
            'conversation_id': conversation_id,
            'query': data['query'],
            'response': best_match['response'],
            'confidence': best_match['confidence'],
            'context': context,
            'timestamp': datetime.utcnow().isoformat(),
            'suggested_actions': [
                'Check API documentation',
                'Try in sandbox environment',
                'Contact support if needed'
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/analytics/user-behavior', methods=['POST'])
def analyze_user_behavior():
    """Analyze user behavior patterns using AI"""
    try:
        data = request.get_json()
        
        if 'user_id' not in data:
            return jsonify({'error': 'Missing required field: user_id'}), 400
        
        user_id = data['user_id']
        analysis_period = data.get('period_days', 30)
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get user's transaction history
        from src.models.database import Wallet
        user_wallets = Wallet.query.filter_by(user_id=user_id).all()
        wallet_ids = [w.id for w in user_wallets]
        
        if not wallet_ids:
            return jsonify({'error': 'No wallets found for user'}), 404
        
        # Get transactions for analysis
        start_date = datetime.utcnow() - timedelta(days=analysis_period)
        transactions = Transaction.query.filter(
            Transaction.wallet_id.in_(wallet_ids),
            Transaction.created_at >= start_date,
            Transaction.status == 'completed'
        ).all()
        
        # Behavioral analysis
        behavior_patterns = {
            'transaction_frequency': len(transactions),
            'avg_transaction_amount': 0,
            'preferred_transaction_times': {},
            'spending_categories': {},
            'payment_methods': {},
            'risk_indicators': []
        }
        
        if transactions:
            # Calculate average transaction amount
            total_amount = sum(float(t.amount) for t in transactions if t.transaction_type == 'debit')
            debit_count = len([t for t in transactions if t.transaction_type == 'debit'])
            behavior_patterns['avg_transaction_amount'] = total_amount / debit_count if debit_count > 0 else 0
            
            # Analyze transaction times
            for transaction in transactions:
                hour = transaction.created_at.hour
                time_slot = f"{hour:02d}:00"
                behavior_patterns['preferred_transaction_times'][time_slot] = \
                    behavior_patterns['preferred_transaction_times'].get(time_slot, 0) + 1
            
            # Analyze payment methods
            for transaction in transactions:
                method = transaction.payment_method or 'unknown'
                behavior_patterns['payment_methods'][method] = \
                    behavior_patterns['payment_methods'].get(method, 0) + 1
            
            # Risk indicators
            if len(transactions) > analysis_period * 2:  # More than 2 transactions per day
                behavior_patterns['risk_indicators'].append('high_activity')
            
            large_transactions = [t for t in transactions if float(t.amount) > behavior_patterns['avg_transaction_amount'] * 5]
            if large_transactions:
                behavior_patterns['risk_indicators'].append('large_transactions')
            
            # Check for unusual patterns
            night_transactions = [t for t in transactions if t.created_at.hour < 6 or t.created_at.hour > 23]
            if len(night_transactions) > len(transactions) * 0.3:  # More than 30% at night
                behavior_patterns['risk_indicators'].append('unusual_timing')
        
        # Generate insights
        insights = []
        if behavior_patterns['transaction_frequency'] > analysis_period:
            insights.append("User shows high engagement with frequent transactions")
        
        if behavior_patterns['avg_transaction_amount'] > 1000:
            insights.append("User tends to make high-value transactions")
        
        if 'card_payment' in behavior_patterns['payment_methods']:
            insights.append("User actively uses card services")
        
        if not behavior_patterns['risk_indicators']:
            insights.append("User shows normal, low-risk behavior patterns")
        
        return jsonify({
            'user_id': user_id,
            'analysis_period_days': analysis_period,
            'behavior_patterns': behavior_patterns,
            'insights': insights,
            'risk_score': len(behavior_patterns['risk_indicators']) * 20,  # Simple risk scoring
            'analyzed_at': datetime.utcnow().isoformat(),
            'model_version': 'FlowletAI-BehaviorAnalysis-v1.3'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/recommendations/financial-products', methods=['POST'])
def recommend_financial_products():
    """AI-powered financial product recommendations"""
    try:
        data = request.get_json()
        
        if 'user_id' not in data:
            return jsonify({'error': 'Missing required field: user_id'}), 400
        
        user_id = data['user_id']
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get user's financial profile
        from src.models.database import Wallet, Card
        user_wallets = Wallet.query.filter_by(user_id=user_id).all()
        user_cards = Card.query.join(Wallet).filter(Wallet.user_id == user_id).all()
        
        # Analyze user's current financial products and usage
        total_balance = sum(float(w.balance) for w in user_wallets)
        has_cards = len(user_cards) > 0
        wallet_count = len(user_wallets)
        
        # Generate recommendations based on profile
        recommendations = []
        
        # High balance users - recommend premium services
        if total_balance > 10000:
            recommendations.append({
                'product': 'Premium Wallet',
                'reason': 'High balance detected - unlock premium features and higher limits',
                'confidence': 85,
                'benefits': ['Higher transaction limits', 'Priority support', 'Advanced analytics']
            })
        
        # Users without cards - recommend card issuance
        if not has_cards and total_balance > 100:
            recommendations.append({
                'product': 'Virtual Debit Card',
                'reason': 'Enable instant online payments and purchases',
                'confidence': 90,
                'benefits': ['Instant issuance', 'Online shopping', 'Spending controls']
            })
        
        # Single wallet users - recommend multi-currency
        if wallet_count == 1 and user_wallets[0].currency == 'USD':
            recommendations.append({
                'product': 'Multi-Currency Wallet',
                'reason': 'Expand global payment capabilities',
                'confidence': 70,
                'benefits': ['Multiple currencies', 'Better exchange rates', 'Global transfers']
            })
        
        # Business recommendations for high-activity users
        recent_transactions = Transaction.query.join(Wallet).filter(
            Wallet.user_id == user_id,
            Transaction.created_at >= datetime.utcnow() - timedelta(days=30)
        ).count()
        
        if recent_transactions > 50:
            recommendations.append({
                'product': 'Business Account',
                'reason': 'High transaction volume suggests business use',
                'confidence': 75,
                'benefits': ['Business features', 'Bulk payments', 'Advanced reporting']
            })
        
        # Default recommendation for new users
        if not recommendations:
            recommendations.append({
                'product': 'Starter Package',
                'reason': 'Perfect for getting started with digital finance',
                'confidence': 60,
                'benefits': ['Basic wallet', 'Simple transfers', 'Mobile app access']
            })
        
        return jsonify({
            'user_id': user_id,
            'recommendations': recommendations,
            'user_profile': {
                'total_balance': total_balance,
                'wallet_count': wallet_count,
                'has_cards': has_cards,
                'recent_activity': recent_transactions
            },
            'generated_at': datetime.utcnow().isoformat(),
            'model_version': 'FlowletAI-ProductRecommendation-v1.1'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


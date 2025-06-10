from flask import Blueprint, request, jsonify
from src.models.database import db, User, KYCRecord
from datetime import datetime, timedelta
import uuid
import random
import re

kyc_aml_bp = Blueprint('kyc_aml', __name__)

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_phone(phone):
    """Validate phone number format"""
    pattern = r'^\+?[1-9]\d{1,14}$'
    return re.match(pattern, phone) is not None

def calculate_risk_score(user_data, verification_data):
    """Calculate risk score based on user data and verification results"""
    risk_score = 0
    
    # Age factor
    if 'date_of_birth' in user_data:
        try:
            birth_date = datetime.strptime(user_data['date_of_birth'], '%Y-%m-%d').date()
            age = (datetime.now().date() - birth_date).days // 365
            if age < 18:
                risk_score += 50  # Underage
            elif age < 25:
                risk_score += 20  # Young adult
            elif age > 80:
                risk_score += 15  # Elderly
        except:
            risk_score += 30  # Invalid date
    
    # Email verification
    if not validate_email(user_data.get('email', '')):
        risk_score += 25
    
    # Phone verification
    if not validate_phone(user_data.get('phone', '')):
        risk_score += 15
    
    # Address completeness
    if not user_data.get('address'):
        risk_score += 20
    
    # Document verification results
    if verification_data.get('document_verified', False):
        risk_score -= 30
    else:
        risk_score += 40
    
    # Biometric verification
    if verification_data.get('biometric_verified', False):
        risk_score -= 20
    
    # Database screening results
    if verification_data.get('watchlist_match', False):
        risk_score += 100
    
    # Ensure score is between 0 and 100
    return max(0, min(100, risk_score))

@kyc_aml_bp.route('/user/create', methods=['POST'])
def create_user():
    """Create a new user with basic information"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'first_name', 'last_name']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate email format
        if not validate_email(data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'error': 'User with this email already exists'}), 409
        
        # Validate date of birth if provided
        date_of_birth = None
        if 'date_of_birth' in data:
            try:
                date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Create new user
        user = User(
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone=data.get('phone'),
            date_of_birth=date_of_birth,
            address=data.get('address'),
            kyc_status='pending'
        )
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'user_id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'kyc_status': user.kyc_status,
            'created_at': user.created_at.isoformat()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@kyc_aml_bp.route('/user/<user_id>', methods=['GET'])
def get_user(user_id):
    """Get user information"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'user_id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone': user.phone,
            'date_of_birth': user.date_of_birth.isoformat() if user.date_of_birth else None,
            'address': user.address,
            'kyc_status': user.kyc_status,
            'created_at': user.created_at.isoformat(),
            'updated_at': user.updated_at.isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@kyc_aml_bp.route('/user/<user_id>', methods=['PUT'])
def update_user(user_id):
    """Update user information"""
    try:
        data = request.get_json()
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Update fields if provided
        if 'first_name' in data:
            user.first_name = data['first_name']
        
        if 'last_name' in data:
            user.last_name = data['last_name']
        
        if 'phone' in data:
            if data['phone'] and not validate_phone(data['phone']):
                return jsonify({'error': 'Invalid phone format'}), 400
            user.phone = data['phone']
        
        if 'date_of_birth' in data:
            try:
                user.date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        if 'address' in data:
            user.address = data['address']
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'user_id': user.id,
            'message': 'User updated successfully',
            'updated_at': user.updated_at.isoformat()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@kyc_aml_bp.route('/verification/start', methods=['POST'])
def start_verification():
    """Start KYC verification process"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['user_id', 'verification_level']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        user = User.query.get(data['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        verification_level = data['verification_level']
        if verification_level not in ['basic', 'enhanced', 'premium']:
            return jsonify({'error': 'Invalid verification level'}), 400
        
        # Check if there's already a pending verification
        existing_verification = KYCRecord.query.filter_by(
            user_id=data['user_id'],
            verification_status='pending'
        ).first()
        
        if existing_verification:
            return jsonify({'error': 'User already has a pending verification'}), 409
        
        # Create new KYC record
        kyc_record = KYCRecord(
            user_id=data['user_id'],
            verification_level=verification_level,
            verification_status='pending',
            verification_provider=data.get('provider', 'Flowlet_Internal')
        )
        
        db.session.add(kyc_record)
        db.session.commit()
        
        return jsonify({
            'verification_id': kyc_record.id,
            'user_id': user.id,
            'verification_level': verification_level,
            'status': 'pending',
            'next_steps': get_verification_steps(verification_level),
            'created_at': kyc_record.created_at.isoformat()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

def get_verification_steps(level):
    """Get required verification steps based on level"""
    steps = {
        'basic': [
            'email_verification',
            'phone_verification'
        ],
        'enhanced': [
            'email_verification',
            'phone_verification',
            'document_upload',
            'address_verification'
        ],
        'premium': [
            'email_verification',
            'phone_verification',
            'document_upload',
            'biometric_verification',
            'address_verification',
            'database_screening'
        ]
    }
    return steps.get(level, [])

@kyc_aml_bp.route('/verification/<verification_id>/document', methods=['POST'])
def submit_document(verification_id):
    """Submit identity document for verification"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['document_type', 'document_number']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        kyc_record = KYCRecord.query.get(verification_id)
        if not kyc_record:
            return jsonify({'error': 'Verification record not found'}), 404
        
        if kyc_record.verification_status != 'pending':
            return jsonify({'error': 'Verification is not in pending status'}), 400
        
        document_type = data['document_type']
        if document_type not in ['passport', 'drivers_license', 'national_id']:
            return jsonify({'error': 'Invalid document type'}), 400
        
        # Update KYC record with document information
        kyc_record.document_type = document_type
        kyc_record.document_number = data['document_number']
        kyc_record.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'verification_id': verification_id,
            'document_type': document_type,
            'status': 'document_submitted',
            'message': 'Document submitted successfully for verification',
            'estimated_processing_time': '1-2 business days'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@kyc_aml_bp.route('/verification/<verification_id>/complete', methods=['POST'])
def complete_verification(verification_id):
    """Complete verification process (simulate external verification results)"""
    try:
        data = request.get_json()
        
        kyc_record = KYCRecord.query.get(verification_id)
        if not kyc_record:
            return jsonify({'error': 'Verification record not found'}), 404
        
        if kyc_record.verification_status != 'pending':
            return jsonify({'error': 'Verification is not in pending status'}), 400
        
        user = User.query.get(kyc_record.user_id)
        
        # Simulate verification results
        verification_data = {
            'document_verified': data.get('document_verified', random.choice([True, False])),
            'biometric_verified': data.get('biometric_verified', random.choice([True, False])),
            'watchlist_match': data.get('watchlist_match', random.random() < 0.05),  # 5% chance
            'address_verified': data.get('address_verified', random.choice([True, False]))
        }
        
        # Calculate risk score
        user_data = {
            'email': user.email,
            'phone': user.phone,
            'date_of_birth': user.date_of_birth.isoformat() if user.date_of_birth else None,
            'address': user.address
        }
        
        risk_score = calculate_risk_score(user_data, verification_data)
        
        # Determine verification result based on risk score and level
        if risk_score <= 30:
            verification_status = 'verified'
            user_kyc_status = 'verified'
        elif risk_score <= 60:
            verification_status = 'verified'
            user_kyc_status = 'verified'
            # Could add additional monitoring
        else:
            verification_status = 'rejected'
            user_kyc_status = 'rejected'
        
        # Update KYC record
        kyc_record.verification_status = verification_status
        kyc_record.verification_date = datetime.utcnow()
        kyc_record.risk_score = risk_score
        kyc_record.notes = f"Automated verification completed. Risk score: {risk_score}"
        kyc_record.updated_at = datetime.utcnow()
        
        # Update user KYC status
        user.kyc_status = user_kyc_status
        user.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'verification_id': verification_id,
            'user_id': user.id,
            'verification_status': verification_status,
            'risk_score': risk_score,
            'verification_level': kyc_record.verification_level,
            'verification_results': verification_data,
            'completed_at': kyc_record.verification_date.isoformat(),
            'notes': kyc_record.notes
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@kyc_aml_bp.route('/verification/<verification_id>', methods=['GET'])
def get_verification_status(verification_id):
    """Get verification status and details"""
    try:
        kyc_record = KYCRecord.query.get(verification_id)
        if not kyc_record:
            return jsonify({'error': 'Verification record not found'}), 404
        
        return jsonify({
            'verification_id': kyc_record.id,
            'user_id': kyc_record.user_id,
            'verification_level': kyc_record.verification_level,
            'document_type': kyc_record.document_type,
            'verification_status': kyc_record.verification_status,
            'verification_provider': kyc_record.verification_provider,
            'verification_date': kyc_record.verification_date.isoformat() if kyc_record.verification_date else None,
            'risk_score': kyc_record.risk_score,
            'notes': kyc_record.notes,
            'created_at': kyc_record.created_at.isoformat(),
            'updated_at': kyc_record.updated_at.isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@kyc_aml_bp.route('/user/<user_id>/verifications', methods=['GET'])
def get_user_verifications(user_id):
    """Get all verification records for a user"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        verifications = KYCRecord.query.filter_by(user_id=user_id)\
            .order_by(KYCRecord.created_at.desc()).all()
        
        verification_list = []
        for verification in verifications:
            verification_list.append({
                'verification_id': verification.id,
                'verification_level': verification.verification_level,
                'verification_status': verification.verification_status,
                'verification_date': verification.verification_date.isoformat() if verification.verification_date else None,
                'risk_score': verification.risk_score,
                'created_at': verification.created_at.isoformat()
            })
        
        return jsonify({
            'user_id': user_id,
            'current_kyc_status': user.kyc_status,
            'verifications': verification_list,
            'total_verifications': len(verification_list)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@kyc_aml_bp.route('/aml/screening', methods=['POST'])
def aml_screening():
    """Perform AML screening against watchlists"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['user_id', 'screening_type']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        user = User.query.get(data['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        screening_type = data['screening_type']
        if screening_type not in ['sanctions', 'pep', 'adverse_media', 'comprehensive']:
            return jsonify({'error': 'Invalid screening type'}), 400
        
        # Simulate AML screening results
        screening_results = {
            'sanctions_match': random.random() < 0.02,  # 2% chance
            'pep_match': random.random() < 0.05,       # 5% chance
            'adverse_media_match': random.random() < 0.03,  # 3% chance
            'risk_level': random.choice(['low', 'medium', 'high']),
            'confidence_score': random.randint(70, 99)
        }
        
        # Determine overall result
        any_match = any([
            screening_results['sanctions_match'],
            screening_results['pep_match'],
            screening_results['adverse_media_match']
        ])
        
        overall_result = 'clear' if not any_match else 'requires_review'
        
        return jsonify({
            'user_id': user.id,
            'screening_type': screening_type,
            'overall_result': overall_result,
            'screening_results': screening_results,
            'screened_at': datetime.utcnow().isoformat(),
            'next_screening_due': (datetime.utcnow() + timedelta(days=90)).isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@kyc_aml_bp.route('/compliance/report', methods=['GET'])
def compliance_report():
    """Generate compliance report"""
    try:
        # Get date range parameters
        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Query verification statistics
        total_users = User.query.count()
        verified_users = User.query.filter_by(kyc_status='verified').count()
        pending_users = User.query.filter_by(kyc_status='pending').count()
        rejected_users = User.query.filter_by(kyc_status='rejected').count()
        
        # Recent verifications
        recent_verifications = KYCRecord.query.filter(
            KYCRecord.created_at >= start_date
        ).count()
        
        # Risk score distribution
        high_risk_users = KYCRecord.query.filter(
            KYCRecord.risk_score >= 70,
            KYCRecord.verification_status == 'verified'
        ).count()
        
        return jsonify({
            'report_period_days': days,
            'generated_at': datetime.utcnow().isoformat(),
            'user_statistics': {
                'total_users': total_users,
                'verified_users': verified_users,
                'pending_users': pending_users,
                'rejected_users': rejected_users,
                'verification_rate': round((verified_users / total_users * 100), 2) if total_users > 0 else 0
            },
            'verification_activity': {
                'recent_verifications': recent_verifications,
                'high_risk_verified_users': high_risk_users
            },
            'compliance_metrics': {
                'average_verification_time': '2.3 days',
                'rejection_rate': round((rejected_users / total_users * 100), 2) if total_users > 0 else 0,
                'manual_review_rate': '15%'
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


from flask import Blueprint, request, jsonify
from src.models.database import db, User, Wallet
from datetime import datetime
import hashlib
import uuid
import jwt
from functools import wraps

auth_bp = Blueprint('auth', __name__)

# Simple JWT secret key (in production, use environment variable)
JWT_SECRET = 'flowlet_jwt_secret_key_2024'

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token.split(' ')[1]
            data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'error': 'User not found'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token is invalid'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'first_name', 'last_name']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'error': 'User with this email already exists'}), 409
        
        # Hash password (simple hash for demo - use bcrypt in production)
        password_hash = hashlib.sha256(data['password'].encode()).hexdigest()
        
        # Create new user
        user = User(
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone=data.get('phone'),
            address=data.get('address'),
            kyc_status='pending'
        )
        
        # Store password hash (add password field to User model)
        user.password_hash = password_hash
        
        db.session.add(user)
        db.session.flush()  # Get the user ID
        
        # Create default wallet for the user
        wallet = Wallet(
            user_id=user.id,
            wallet_type='user',
            currency='USD',
            balance=0.00,
            available_balance=0.00,
            status='active'
        )
        
        db.session.add(wallet)
        db.session.commit()
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': user.id,
            'email': user.email,
            'exp': datetime.utcnow().timestamp() + 86400  # 24 hours
        }, JWT_SECRET, algorithm='HS256')
        
        return jsonify({
            'message': 'User registered successfully',
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'kyc_status': user.kyc_status,
                'created_at': user.created_at.isoformat()
            },
            'wallet_id': wallet.id,
            'token': token
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if 'email' not in data or 'password' not in data:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find user by email
        user = User.query.filter_by(email=data['email']).first()
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Check password (simple hash comparison)
        password_hash = hashlib.sha256(data['password'].encode()).hexdigest()
        if not hasattr(user, 'password_hash') or user.password_hash != password_hash:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Get user's primary wallet
        wallet = Wallet.query.filter_by(user_id=user.id).first()
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': user.id,
            'email': user.email,
            'exp': datetime.utcnow().timestamp() + 86400  # 24 hours
        }, JWT_SECRET, algorithm='HS256')
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone,
                'kyc_status': user.kyc_status,
                'created_at': user.created_at.isoformat()
            },
            'wallet_id': wallet.id if wallet else None,
            'token': token
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    """Get user profile"""
    try:
        # Get user's wallets
        wallets = Wallet.query.filter_by(user_id=current_user.id).all()
        
        wallet_data = []
        for wallet in wallets:
            wallet_data.append({
                'id': wallet.id,
                'wallet_type': wallet.wallet_type,
                'currency': wallet.currency,
                'balance': str(wallet.balance),
                'available_balance': str(wallet.available_balance),
                'status': wallet.status
            })
        
        return jsonify({
            'user': {
                'id': current_user.id,
                'email': current_user.email,
                'first_name': current_user.first_name,
                'last_name': current_user.last_name,
                'phone': current_user.phone,
                'address': current_user.address,
                'kyc_status': current_user.kyc_status,
                'created_at': current_user.created_at.isoformat()
            },
            'wallets': wallet_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    """Update user profile"""
    try:
        data = request.get_json()
        
        # Update allowed fields
        if 'first_name' in data:
            current_user.first_name = data['first_name']
        if 'last_name' in data:
            current_user.last_name = data['last_name']
        if 'phone' in data:
            current_user.phone = data['phone']
        if 'address' in data:
            current_user.address = data['address']
        
        current_user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': {
                'id': current_user.id,
                'email': current_user.email,
                'first_name': current_user.first_name,
                'last_name': current_user.last_name,
                'phone': current_user.phone,
                'address': current_user.address,
                'kyc_status': current_user.kyc_status,
                'updated_at': current_user.updated_at.isoformat()
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/verify-token', methods=['POST'])
def verify_token():
    """Verify JWT token"""
    try:
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'valid': False, 'error': 'Token is missing'}), 401
        
        if token.startswith('Bearer '):
            token = token.split(' ')[1]
        
        data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        user = User.query.get(data['user_id'])
        
        if not user:
            return jsonify({'valid': False, 'error': 'User not found'}), 401
        
        return jsonify({
            'valid': True,
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name
            }
        }), 200
        
    except jwt.ExpiredSignatureError:
        return jsonify({'valid': False, 'error': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'valid': False, 'error': 'Token is invalid'}), 401
    except Exception as e:
        return jsonify({'valid': False, 'error': str(e)}), 500


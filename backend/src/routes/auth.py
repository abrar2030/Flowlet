"""
Enhanced Authentication System with Financial-Grade Security
"""

from flask import Blueprint, request, jsonify, g, current_app
from src.models.database import db, User, Wallet
from src.models.account import Account, AccountType, AccountStatus
from src.security.encryption import PasswordManager, TokenManager
from src.security.audit_logger import AuditLogger
from src.security.input_validator import InputValidator
from src.security.rate_limiter import RateLimiter
from datetime import datetime, timezone, timedelta
import uuid
import re
import logging
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import secrets
import pyotp
import qrcode
import io
import base64

# Create blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/api/v1/auth')

# Configure logging
logger = logging.getLogger(__name__)

# Initialize security components
password_manager = PasswordManager()
token_manager = TokenManager()
audit_logger = AuditLogger()
input_validator = InputValidator()
rate_limiter = RateLimiter()

def token_required(f):
    """Enhanced JWT token validation decorator"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            audit_logger.log_security_event(
                event_type='authentication_failed',
                details={'reason': 'missing_token', 'ip': request.remote_addr}
            )
            return jsonify({
                'error': 'Authentication token is required',
                'code': 'TOKEN_MISSING'
            }), 401
        
        try:
            # Validate and decode token
            payload = token_manager.validate_access_token(token)
            current_user = User.query.get(payload['user_id'])
            
            if not current_user:
                audit_logger.log_security_event(
                    event_type='authentication_failed',
                    details={'reason': 'user_not_found', 'user_id': payload.get('user_id')}
                )
                return jsonify({
                    'error': 'User not found',
                    'code': 'USER_NOT_FOUND'
                }), 401
            
            if not current_user.is_active:
                audit_logger.log_security_event(
                    event_type='authentication_failed',
                    details={'reason': 'user_inactive', 'user_id': current_user.id}
                )
                return jsonify({
                    'error': 'User account is inactive',
                    'code': 'USER_INACTIVE'
                }), 401
            
            # Store current user in request context
            g.current_user = current_user
            
            return f(*args, **kwargs)
            
        except jwt.ExpiredSignatureError:
            audit_logger.log_security_event(
                event_type='authentication_failed',
                details={'reason': 'token_expired', 'ip': request.remote_addr}
            )
            return jsonify({
                'error': 'Token has expired',
                'code': 'TOKEN_EXPIRED'
            }), 401
        except jwt.InvalidTokenError:
            audit_logger.log_security_event(
                event_type='authentication_failed',
                details={'reason': 'invalid_token', 'ip': request.remote_addr}
            )
            return jsonify({
                'error': 'Invalid token',
                'code': 'TOKEN_INVALID'
            }), 401
        except Exception as e:
            logger.error(f"Token validation error: {str(e)}")
            return jsonify({
                'error': 'Authentication failed',
                'code': 'AUTH_ERROR'
            }), 401
    
    return decorated

def admin_required(f):
    """Decorator to require admin privileges"""
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if not g.current_user.is_admin:
            audit_logger.log_security_event(
                event_type='authorization_failed',
                details={'reason': 'insufficient_privileges', 'user_id': g.current_user.id}
            )
            return jsonify({
                'error': 'Admin privileges required',
                'code': 'INSUFFICIENT_PRIVILEGES'
            }), 403
        return f(*args, **kwargs)
    return decorated

@auth_bp.route('/register', methods=['POST'])
@rate_limiter.limit("5 per minute")
def register():
    """
    Enhanced user registration with comprehensive validation
    
    Expected JSON payload:
    {
        "email": "string",
        "password": "string",
        "first_name": "string",
        "last_name": "string",
        "phone": "string" (optional),
        "date_of_birth": "YYYY-MM-DD" (optional),
        "address": {
            "street": "string",
            "city": "string",
            "state": "string",
            "postal_code": "string",
            "country": "string"
        } (optional)
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'Request body must contain valid JSON',
                'code': 'INVALID_JSON'
            }), 400
        
        # Validate required fields
        required_fields = ['email', 'password', 'first_name', 'last_name']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'error': f'Missing required fields: {", ".join(missing_fields)}',
                'code': 'MISSING_FIELDS',
                'missing_fields': missing_fields
            }), 400
        
        # Validate email format
        if not input_validator.validate_email(data['email']):
            return jsonify({
                'error': 'Invalid email format',
                'code': 'INVALID_EMAIL'
            }), 400
        
        # Validate password strength
        password_validation = password_manager.validate_password_strength(data['password'])
        if not password_validation['valid']:
            return jsonify({
                'error': 'Password does not meet security requirements',
                'code': 'WEAK_PASSWORD',
                'requirements': password_validation['requirements']
            }), 400
        
        # Validate phone number if provided
        if 'phone' in data and data['phone']:
            if not input_validator.validate_phone(data['phone']):
                return jsonify({
                    'error': 'Invalid phone number format',
                    'code': 'INVALID_PHONE'
                }), 400
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=data['email'].lower()).first()
        if existing_user:
            audit_logger.log_security_event(
                event_type='registration_failed',
                details={'reason': 'email_exists', 'email': data['email'], 'ip': request.remote_addr}
            )
            return jsonify({
                'error': 'Invalid registration details',
                'code': 'REGISTRATION_FAILED'
            }), 400
        
        # Check if phone number already exists (if provided)
        if 'phone' in data and data['phone']:
            existing_phone = User.query.filter_by(phone=data['phone']).first()
            if existing_phone:
                return jsonify({
                    'error': 'Invalid registration details',
                    'code': 'REGISTRATION_FAILED'
                }), 400
        
        # Hash password securely
        password_hash = password_manager.hash_password(data['password'])
        
        # Create new user
        user = User(
            email=data['email'].lower(),
            first_name=input_validator.sanitize_string(data['first_name']),
            last_name=input_validator.sanitize_string(data['last_name']),
            phone=data.get('phone'),
            password_hash=password_hash,
            kyc_status='pending',
            is_active=True,
            email_verified=False,
            phone_verified=False,
            two_factor_enabled=False,
            failed_login_attempts=0,
            last_login_at=None,
            password_changed_at=datetime.now(timezone.utc)
        )
        
        # Set date of birth if provided
        if 'date_of_birth' in data:
            try:
                user.date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({
                    'error': 'Invalid date of birth format. Use YYYY-MM-DD',
                    'code': 'INVALID_DATE_FORMAT'
                }), 400
        
        # Set address if provided
        if 'address' in data and isinstance(data['address'], dict):
            address_data = data['address']
            user.address_street = input_validator.sanitize_string(address_data.get('street', ''))
            user.address_city = input_validator.sanitize_string(address_data.get('city', ''))
            user.address_state = input_validator.sanitize_string(address_data.get('state', ''))
            user.address_postal_code = input_validator.sanitize_string(address_data.get('postal_code', ''))
            user.address_country = input_validator.sanitize_string(address_data.get('country', ''))
        
        db.session.add(user)
        db.session.flush()  # Get the user ID
        
        # Create default checking account for the user
        account = Account(
            user_id=user.id,
            account_name=f"{user.first_name}'s Checking Account",
            account_type=AccountType.CHECKING,
            currency='USD',
            status=AccountStatus.ACTIVE
        )
        
        db.session.add(account)
        db.session.commit()
        
        # Generate email verification token
        verification_token = token_manager.generate_verification_token(user.id, 'email')
        
        # Log successful registration
        audit_logger.log_user_event(
            user_id=user.id,
            event_type='user_registered',
            details={'email': user.email, 'ip': request.remote_addr}
        )
        
        # Generate access and refresh tokens
        access_token = token_manager.generate_access_token(user.id)
        refresh_token = token_manager.generate_refresh_token(user.id)
        
        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'user': {
                'id': str(user.id),
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone,
                'kyc_status': user.kyc_status,
                'email_verified': user.email_verified,
                'phone_verified': user.phone_verified,
                'two_factor_enabled': user.two_factor_enabled,
                'created_at': user.created_at.isoformat()
            },
            'account': {
                'id': str(account.id),
                'account_name': account.account_name,
                'account_type': account.account_type.value,
                'currency': account.currency,
                'status': account.status.value
            },
            'tokens': {
                'access_token': access_token,
                'refresh_token': refresh_token,
                'token_type': 'Bearer',
                'expires_in': 3600  # 1 hour
            },
            'verification_token': verification_token,
            'next_steps': [
                'Verify your email address',
                'Complete KYC verification',
                'Set up two-factor authentication (recommended)'
            ]
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Registration error: {str(e)}")
        return jsonify({
            'error': 'Registration failed',
            'code': 'REGISTRATION_ERROR'
        }), 500

@auth_bp.route('/login', methods=['POST'])
@rate_limiter.limit("10 per minute")
def login():
    """
    Enhanced user login with security features
    
    Expected JSON payload:
    {
        "email": "string",
        "password": "string",
        "two_factor_code": "string" (optional, required if 2FA enabled)
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'Request body must contain valid JSON',
                'code': 'INVALID_JSON'
            }), 400
        
        # Validate required fields
        if 'email' not in data or 'password' not in data:
            return jsonify({
                'error': 'Email and password are required',
                'code': 'MISSING_CREDENTIALS'
            }), 400
        
        # Find user by email
        user = User.query.filter_by(email=data['email'].lower()).first()
        if not user:
            audit_logger.log_security_event(
                event_type='login_failed',
                details={'reason': 'user_not_found', 'email': data['email'], 'ip': request.remote_addr}
            )
            # Return a generic error to prevent user enumeration
            return jsonify({
                'error': 'Invalid email or password',
                'code': 'INVALID_CREDENTIALS'
            }), 401
        
        # Check if account is locked
        if user.failed_login_attempts >= 5:
            if user.account_locked_until and user.account_locked_until > datetime.now(timezone.utc):
                audit_logger.log_security_event(
                    event_type='login_failed',
                    details={'reason': 'account_locked', 'user_id': user.id, 'ip': request.remote_addr}
                )
                return jsonify({
                    'error': 'Account is temporarily locked due to multiple failed login attempts',
                    'code': 'ACCOUNT_LOCKED',
                    'locked_until': user.account_locked_until.isoformat()
                }), 423
        
        # Check if user is active
        if not user.is_active:
            audit_logger.log_security_event(
                event_type='login_failed',
                details={'reason': 'user_inactive', 'user_id': user.id, 'ip': request.remote_addr}
            )
            return jsonify({
                'error': 'User account is inactive',
                'code': 'USER_INACTIVE'
            }), 401
        
        # Verify password
        if not password_manager.verify_password(data['password'], user.password_hash):
            # Increment failed login attempts
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                user.account_locked_until = datetime.now(timezone.utc) + timedelta(minutes=30)
            
            db.session.commit()
            
            audit_logger.log_security_event(
                event_type='login_failed',
                details={
                    'reason': 'invalid_password',
                    'user_id': user.id,
                    'failed_attempts': user.failed_login_attempts,
                    'ip': request.remote_addr
                }
            )
            return jsonify({
                'error': 'Invalid email or password',
                'code': 'INVALID_CREDENTIALS'
            }), 401
        
        # Check two-factor authentication if enabled
        if user.two_factor_enabled:
            if 'two_factor_code' not in data:
                return jsonify({
                    'error': 'Two-factor authentication code is required',
                    'code': 'TWO_FACTOR_REQUIRED'
                }), 200  # Not an error, just needs 2FA
            
            if not user.verify_totp(data['two_factor_code']):
                user.failed_login_attempts += 1
                db.session.commit()
                
                audit_logger.log_security_event(
                    event_type='login_failed',
                    details={'reason': 'invalid_2fa', 'user_id': user.id, 'ip': request.remote_addr}
                )
                return jsonify({
                    'error': 'Invalid two-factor authentication code',
                    'code': 'INVALID_TWO_FACTOR'
                }), 401
        
        # Reset failed login attempts on successful login
        user.failed_login_attempts = 0
        user.account_locked_until = None
        user.last_login_at = datetime.now(timezone.utc)
        user.last_login_ip = request.remote_addr
        
        db.session.commit()
        
        # Get user's primary account
        account = Account.query.filter_by(user_id=user.id).first()
        
        # Generate access and refresh tokens
        access_token = token_manager.generate_access_token(user.id)
        refresh_token = token_manager.generate_refresh_token(user.id)
        
        # Log successful login
        audit_logger.log_user_event(
            user_id=user.id,
            event_type='user_login',
            details={'ip': request.remote_addr, 'user_agent': request.headers.get('User-Agent')}
        )
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': {
                'id': str(user.id),
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone,
                'kyc_status': user.kyc_status,
                'email_verified': user.email_verified,
                'phone_verified': user.phone_verified,
                'two_factor_enabled': user.two_factor_enabled,
                'last_login_at': user.last_login_at.isoformat()
            },
            'account': {
                'id': str(account.id) if account else None,
                'account_name': account.account_name if account else None,
                'account_type': account.account_type.value if account else None,
                'currency': account.currency if account else None,
                'status': account.status.value if account else None
            },
            'tokens': {
                'access_token': access_token,
                'refresh_token': refresh_token,
                'token_type': 'Bearer',
                'expires_in': 3600  # 1 hour
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({
            'error': 'Login failed',
            'code': 'LOGIN_ERROR'
        }), 500

@auth_bp.route('/refresh', methods=['POST'])
def refresh_token():
    """
    Refresh access token using refresh token
    
    Expected JSON payload:
    {
        "refresh_token": "string"
    }
    """
    try:
        data = request.get_json()
        if not data or 'refresh_token' not in data:
            return jsonify({
                'error': 'Refresh token is required',
                'code': 'REFRESH_TOKEN_MISSING'
            }), 400
        
        # Validate refresh token
        payload = token_manager.validate_refresh_token(data['refresh_token'])
        user = User.query.get(payload['user_id'])
        
        if not user or not user.is_active:
            return jsonify({
                'error': 'Invalid refresh token',
                'code': 'INVALID_REFRESH_TOKEN'
            }), 401
        
        # Generate new access token
        access_token = token_manager.generate_access_token(user.id)
        
        return jsonify({
            'success': True,
            'tokens': {
                'access_token': access_token,
                'token_type': 'Bearer',
                'expires_in': 3600  # 1 hour
            }
        }), 200
        
    except jwt.ExpiredSignatureError:
        return jsonify({
            'error': 'Refresh token has expired',
            'code': 'REFRESH_TOKEN_EXPIRED'
        }), 401
    except jwt.InvalidTokenError:
        return jsonify({
            'error': 'Invalid refresh token',
            'code': 'INVALID_REFRESH_TOKEN'
        }), 401
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        return jsonify({
            'error': 'Token refresh failed',
            'code': 'REFRESH_ERROR'
        }), 500

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout():
    """Logout user and invalidate tokens"""
    try:
        # Get token from header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            # Add token to blacklist
            token_manager.blacklist_token(token)
        
        # Log logout event
        audit_logger.log_user_event(
            user_id=g.current_user.id,
            event_type='user_logout',
            details={'ip': request.remote_addr}
        )
        
        return jsonify({
            'success': True,
            'message': 'Logout successful'
        }), 200
        
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return jsonify({
            'error': 'Logout failed',
            'code': 'LOGOUT_ERROR'
        }), 500

@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile():
    """Get user profile with enhanced details"""
    try:
        user = g.current_user
        
        # Get user's accounts
        accounts = Account.query.filter_by(user_id=user.id).all()
        
        account_data = []
        for account in accounts:
            account_data.append({
                'id': str(account.id),
                'account_name': account.account_name,
                'account_type': account.account_type.value,
                'currency': account.currency,
                'available_balance': float(account.get_available_balance_decimal()),
                'current_balance': float(account.get_current_balance_decimal()),
                'status': account.status.value,
                'created_at': account.created_at.isoformat()
            })
        
        return jsonify({
            'success': True,
            'user': {
                'id': str(user.id),
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone,
                'date_of_birth': user.date_of_birth.isoformat() if user.date_of_birth else None,
                'address': {
                    'street': user.address_street,
                    'city': user.address_city,
                    'state': user.address_state,
                    'postal_code': user.address_postal_code,
                    'country': user.address_country
                } if user.address_street else None,
                'kyc_status': user.kyc_status,
                'email_verified': user.email_verified,
                'phone_verified': user.phone_verified,
                'two_factor_enabled': user.two_factor_enabled,
                'last_login_at': user.last_login_at.isoformat() if user.last_login_at else None,
                'created_at': user.created_at.isoformat(),
                'updated_at': user.updated_at.isoformat()
            },
            'accounts': account_data,
            'security': {
                'password_strength': 'strong',  # Could be calculated
                'two_factor_enabled': user.two_factor_enabled,
                'email_verified': user.email_verified,
                'phone_verified': user.phone_verified,
                'last_password_change': user.password_changed_at.isoformat() if user.password_changed_at else None
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Get profile error: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve profile',
            'code': 'PROFILE_ERROR'
        }), 500

@auth_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile():
    """Update user profile with validation"""
    try:
        user = g.current_user
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'Request body must contain valid JSON',
                'code': 'INVALID_JSON'
            }), 400
        
        # Update allowed fields with validation
        if 'first_name' in data:
            user.first_name = input_validator.sanitize_string(data['first_name'])
        
        if 'last_name' in data:
            user.last_name = input_validator.sanitize_string(data['last_name'])
        
        if 'phone' in data:
            if data['phone'] and not input_validator.validate_phone(data['phone']):
                return jsonify({
                    'error': 'Invalid phone number format',
                    'code': 'INVALID_PHONE'
                }), 400
            user.phone = data['phone']
        
        if 'date_of_birth' in data:
            try:
                user.date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({
                    'error': 'Invalid date of birth format. Use YYYY-MM-DD',
                    'code': 'INVALID_DATE_FORMAT'
                }), 400
        
        if 'address' in data and isinstance(data['address'], dict):
            address_data = data['address']
            user.address_street = input_validator.sanitize_string(address_data.get('street', ''))
            user.address_city = input_validator.sanitize_string(address_data.get('city', ''))
            user.address_state = input_validator.sanitize_string(address_data.get('state', ''))
            user.address_postal_code = input_validator.sanitize_string(address_data.get('postal_code', ''))
            user.address_country = input_validator.sanitize_string(address_data.get('country', ''))
        
        user.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        
        # Log profile update
        audit_logger.log_user_event(
            user_id=user.id,
            event_type='profile_updated',
            details={'updated_fields': list(data.keys()), 'ip': request.remote_addr}
        )
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully',
            'user': {
                'id': str(user.id),
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone,
                'date_of_birth': user.date_of_birth.isoformat() if user.date_of_birth else None,
                'updated_at': user.updated_at.isoformat()
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Update profile error: {str(e)}")
        return jsonify({
            'error': 'Failed to update profile',
            'code': 'UPDATE_ERROR'
        }), 500

@auth_bp.route('/change-password', methods=['POST'])
@token_required
def change_password():
    """
    Change user password with security validation
    
    Expected JSON payload:
    {
        "current_password": "string",
        "new_password": "string",
        "confirm_password": "string"
    }
    """
    try:
        user = g.current_user
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'Request body must contain valid JSON',
                'code': 'INVALID_JSON'
            }), 400
        
        # Validate required fields
        required_fields = ['current_password', 'new_password', 'confirm_password']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'error': f'Missing required fields: {", ".join(missing_fields)}',
                'code': 'MISSING_FIELDS'
            }), 400
        
        # Verify current password
        if not password_manager.verify_password(data['current_password'], user.password_hash):
            audit_logger.log_security_event(
                event_type='password_change_failed',
                details={'reason': 'invalid_current_password', 'user_id': user.id}
            )
            return jsonify({
                'error': 'Current password is incorrect',
                'code': 'INVALID_CURRENT_PASSWORD'
            }), 401
        
        # Validate new password confirmation
        if data['new_password'] != data['confirm_password']:
            return jsonify({
                'error': 'New password and confirmation do not match',
                'code': 'PASSWORD_MISMATCH'
            }), 400
        
        # Validate new password strength
        password_validation = password_manager.validate_password_strength(data['new_password'])
        if not password_validation['valid']:
            return jsonify({
                'error': 'New password does not meet security requirements',
                'code': 'WEAK_PASSWORD',
                'requirements': password_validation['requirements']
            }), 400
        
        # Check if new password is different from current
        if password_manager.verify_password(data['new_password'], user.password_hash):
            return jsonify({
                'error': 'New password must be different from current password',
                'code': 'SAME_PASSWORD'
            }), 400
        
        # Update password
        user.password_hash = password_manager.hash_password(data['new_password'])
        user.password_changed_at = datetime.now(timezone.utc)
        user.updated_at = datetime.now(timezone.utc)
        
        db.session.commit()
        
        # Log password change
        audit_logger.log_security_event(
            event_type='password_changed',
            details={'user_id': user.id, 'ip': request.remote_addr}
        )
        
        return jsonify({
            'success': True,
            'message': 'Password changed successfully',
            'password_changed_at': user.password_changed_at.isoformat()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Change password error: {str(e)}")
        return jsonify({
            'error': 'Failed to change password',
            'code': 'PASSWORD_CHANGE_ERROR'
        }), 500

@auth_bp.route('/setup-2fa', methods=['POST'])
@token_required
def setup_two_factor():
    """Setup two-factor authentication"""
    try:
        user = g.current_user
        
        if user.two_factor_enabled:
            return jsonify({
                'error': 'Two-factor authentication is already enabled',
                'code': 'TWO_FACTOR_ALREADY_ENABLED'
            }), 400
        
        # Generate TOTP secret
        secret = pyotp.random_base32()
        user.totp_secret = secret
        
        # Generate QR code
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user.email,
            issuer_name="Flowlet Financial"
        )
        
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        
        qr_code_base64 = base64.b64encode(img_buffer.getvalue()).decode()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'secret': secret,
            'qr_code': f"data:image/png;base64,{qr_code_base64}",
            'backup_codes': [],  # Could generate backup codes
            'instructions': [
                '1. Install an authenticator app (Google Authenticator, Authy, etc.)',
                '2. Scan the QR code or manually enter the secret',
                '3. Enter the 6-digit code from your app to verify setup'
            ]
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Setup 2FA error: {str(e)}")
        return jsonify({
            'error': 'Failed to setup two-factor authentication',
            'code': 'TWO_FACTOR_SETUP_ERROR'
        }), 500

@auth_bp.route('/verify-2fa', methods=['POST'])
@token_required
def verify_two_factor():
    """
    Verify and enable two-factor authentication
    
    Expected JSON payload:
    {
        "code": "string"
    }
    """
    try:
        user = g.current_user
        data = request.get_json()
        
        if not data or 'code' not in data:
            return jsonify({
                'error': 'Verification code is required',
                'code': 'CODE_MISSING'
            }), 400
        
        if not user.totp_secret:
            return jsonify({
                'error': 'Two-factor authentication setup not initiated',
                'code': 'TWO_FACTOR_NOT_SETUP'
            }), 400
        
        # Verify TOTP code
        if not user.verify_totp(data['code']):
            return jsonify({
                'error': 'Invalid verification code',
                'code': 'INVALID_CODE'
            }), 401
        
        # Enable two-factor authentication
        user.two_factor_enabled = True
        user.updated_at = datetime.now(timezone.utc)
        
        db.session.commit()
        
        # Log 2FA enablement
        audit_logger.log_security_event(
            event_type='two_factor_enabled',
            details={'user_id': user.id, 'ip': request.remote_addr}
        )
        
        return jsonify({
            'success': True,
            'message': 'Two-factor authentication enabled successfully',
            'two_factor_enabled': True
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Verify 2FA error: {str(e)}")
        return jsonify({
            'error': 'Failed to verify two-factor authentication',
            'code': 'TWO_FACTOR_VERIFY_ERROR'
        }), 500

@auth_bp.route('/disable-2fa', methods=['POST'])
@token_required
def disable_two_factor():
    """
    Disable two-factor authentication
    
    Expected JSON payload:
    {
        "password": "string",
        "code": "string"
    }
    """
    try:
        user = g.current_user
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'Request body must contain valid JSON',
                'code': 'INVALID_JSON'
            }), 400
        
        if not user.two_factor_enabled:
            return jsonify({
                'error': 'Two-factor authentication is not enabled',
                'code': 'TWO_FACTOR_NOT_ENABLED'
            }), 400
        
        # Verify password
        if 'password' not in data or not password_manager.verify_password(data['password'], user.password_hash):
            return jsonify({
                'error': 'Password verification required',
                'code': 'PASSWORD_REQUIRED'
            }), 401
        
        # Verify current TOTP code
        if 'code' not in data or not user.verify_totp(data['code']):
            return jsonify({
                'error': 'Current two-factor code required',
                'code': 'TWO_FACTOR_CODE_REQUIRED'
            }), 401
        
        # Disable two-factor authentication
        user.two_factor_enabled = False
        user.totp_secret = None
        user.updated_at = datetime.now(timezone.utc)
        
        db.session.commit()
        
        # Log 2FA disablement
        audit_logger.log_security_event(
            event_type='two_factor_disabled',
            details={'user_id': user.id, 'ip': request.remote_addr}
        )
        
        return jsonify({
            'success': True,
            'message': 'Two-factor authentication disabled successfully',
            'two_factor_enabled': False
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Disable 2FA error: {str(e)}")
        return jsonify({
            'error': 'Failed to disable two-factor authentication',
            'code': 'TWO_FACTOR_DISABLE_ERROR'
        }), 500

@auth_bp.route('/verify-token', methods=['POST'])
def verify_token():
    """Verify JWT token validity"""
    try:
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({
                'valid': False,
                'error': 'Token is missing',
                'code': 'TOKEN_MISSING'
            }), 401
        
        # Validate token
        payload = token_manager.validate_access_token(token)
        user = User.query.get(payload['user_id'])
        
        if not user or not user.is_active:
            return jsonify({
                'valid': False,
                'error': 'User not found or inactive',
                'code': 'USER_INVALID'
            }), 401
        
        return jsonify({
            'valid': True,
            'user': {
                'id': str(user.id),
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'kyc_status': user.kyc_status
            },
            'expires_at': payload['exp']
        }), 200
        
    except jwt.ExpiredSignatureError:
        return jsonify({
            'valid': False,
            'error': 'Token has expired',
            'code': 'TOKEN_EXPIRED'
        }), 401
    except jwt.InvalidTokenError:
        return jsonify({
            'valid': False,
            'error': 'Token is invalid',
            'code': 'TOKEN_INVALID'
        }), 401
    except Exception as e:
        logger.error(f"Token verification error: {str(e)}")
        return jsonify({
            'valid': False,
            'error': 'Token verification failed',
            'code': 'VERIFICATION_ERROR'
        }), 500

@auth_bp.route('/security-events', methods=['GET'])
@token_required
def get_security_events():
    """Get user's security events"""
    try:
        user = g.current_user
        
        # Get recent security events for the user
        events = audit_logger.get_user_security_events(user.id, limit=50)
        
        return jsonify({
            'success': True,
            'events': events,
            'total': len(events)
        }), 200
        
    except Exception as e:
        logger.error(f"Get security events error: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve security events',
            'code': 'SECURITY_EVENTS_ERROR'
        }), 500


"""
Simplified Flowlet Application for Deployment
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import os
import uuid
import secrets
from datetime import datetime, timezone, timedelta
from decimal import Decimal

# Initialize Flask app
app = Flask(__name__, static_folder='../unified-frontend/dist', static_url_path='')

# Configuration
app.config.update({
    'SECRET_KEY': os.environ.get('SECRET_KEY', secrets.token_urlsafe(32)),
    'SQLALCHEMY_DATABASE_URI': os.environ.get('DATABASE_URL', 'sqlite:///flowlet_simple.db'),
    'SQLALCHEMY_TRACK_MODIFICATIONS': False,
})

# Initialize extensions
db = SQLAlchemy(app)

# Configure CORS
CORS(app, origins=['*'], supports_credentials=True)

# ============================================================================
# DATABASE MODELS
# ============================================================================

class User(db.Model):
    """User model"""
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    phone_number = db.Column(db.String(20), nullable=True)
    
    # Account status
    status = db.Column(db.String(20), nullable=False, default='active')
    kyc_status = db.Column(db.String(20), nullable=False, default='pending')
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    
    def set_password(self, password):
        """Set password with strong hashing"""
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256:100000')
    
    def check_password(self, password):
        """Check password"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone_number': self.phone_number,
            'status': self.status,
            'kyc_status': self.kyc_status,
            'created_at': self.created_at.isoformat()
        }

class Account(db.Model):
    """Account model"""
    __tablename__ = 'accounts'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Account details
    account_name = db.Column(db.String(255), nullable=False)
    account_number = db.Column(db.String(20), nullable=False, unique=True, index=True)
    account_type = db.Column(db.String(50), nullable=False, default='checking')
    currency = db.Column(db.String(3), nullable=False, default='USD')
    
    # Balances (stored as cents to avoid floating point issues)
    available_balance_cents = db.Column(db.BigInteger, nullable=False, default=0)
    current_balance_cents = db.Column(db.BigInteger, nullable=False, default=0)
    
    # Status
    status = db.Column(db.String(20), nullable=False, default='active')
    
    # Timestamps
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    
    # Relationship
    user = db.relationship('User', backref='accounts')
    
    @property
    def available_balance(self):
        """Get available balance as Decimal"""
        return Decimal(self.available_balance_cents) / 100
    
    @available_balance.setter
    def available_balance(self, value):
        """Set available balance from Decimal"""
        self.available_balance_cents = int(Decimal(str(value)) * 100)
    
    @property
    def current_balance(self):
        """Get current balance as Decimal"""
        return Decimal(self.current_balance_cents) / 100
    
    @current_balance.setter
    def current_balance(self, value):
        """Set current balance from Decimal"""
        self.current_balance_cents = int(Decimal(str(value)) * 100)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'account_name': self.account_name,
            'account_number': f"****{self.account_number[-4:]}",
            'account_type': self.account_type,
            'currency': self.currency,
            'available_balance': str(self.available_balance),
            'current_balance': str(self.current_balance),
            'status': self.status,
            'created_at': self.created_at.isoformat()
        }

# ============================================================================
# API ROUTES
# ============================================================================

@app.route('/api/v1/auth/register', methods=['POST'])
def register():
    """User registration"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'Request body must contain valid JSON'}), 400
        
        # Validate required fields
        required_fields = ['email', 'password', 'first_name', 'last_name']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({'success': False, 'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=data['email'].lower()).first()
        if existing_user:
            return jsonify({'success': False, 'error': 'User with this email already exists'}), 409
        
        # Create new user
        user = User(
            email=data['email'].lower(),
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone_number=data.get('phone_number')
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.flush()  # Get the user ID
        
        # Create default checking account
        account_number = f"ACC{str(uuid.uuid4()).replace('-', '')[:12].upper()}"
        account = Account(
            user_id=user.id,
            account_name=f"{user.first_name}'s Checking Account",
            account_number=account_number,
            account_type='checking',
            currency='USD'
        )
        # Set initial balance of $1000 for demo purposes
        account.available_balance = Decimal('1000.00')
        account.current_balance = Decimal('1000.00')
        
        db.session.add(account)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'user': user.to_dict(),
            'account': account.to_dict(),
            'access_token': 'demo_token_' + user.id,
            'token_type': 'Bearer'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Registration failed'}), 500

@app.route('/api/v1/auth/login', methods=['POST'])
def login():
    """User login"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'Request body must contain valid JSON'}), 400
        
        # Validate required fields
        if 'email' not in data or 'password' not in data:
            return jsonify({'success': False, 'error': 'Email and password are required'}), 400
        
        # Find user by email
        user = User.query.filter_by(email=data['email'].lower()).first()
        if not user:
            return jsonify({'success': False, 'error': 'Invalid email or password'}), 401
        
        # Check if user is active
        if not user.is_active:
            return jsonify({'success': False, 'error': 'User account is inactive'}), 401
        
        # Verify password
        if not user.check_password(data['password']):
            return jsonify({'success': False, 'error': 'Invalid email or password'}), 401
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': user.to_dict(),
            'access_token': 'demo_token_' + user.id,
            'token_type': 'Bearer'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': 'Login failed'}), 500

@app.route('/api/v1/accounts', methods=['GET'])
def get_accounts():
    """Get user accounts"""
    try:
        # For demo purposes, return all accounts
        accounts = Account.query.all()
        
        return jsonify({
            'success': True,
            'accounts': [account.to_dict() for account in accounts]
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': 'Failed to get accounts'}), 500

@app.route('/api/v1/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'message': 'Flowlet API is running',
        'timestamp': datetime.now(timezone.utc).isoformat()
    }), 200

# ============================================================================
# FRONTEND ROUTES
# ============================================================================

@app.route('/')
def serve_frontend():
    """Serve the React frontend"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static_files(path):
    """Serve static files or fallback to index.html for SPA routing"""
    try:
        return send_from_directory(app.static_folder, path)
    except:
        # Fallback to index.html for SPA routing
        return send_from_directory(app.static_folder, 'index.html')

# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors by serving the React app"""
    return send_from_directory(app.static_folder, 'index.html')

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    db.session.rollback()
    return jsonify({'success': False, 'error': 'Internal server error'}), 500

# ============================================================================
# DATABASE INITIALIZATION
# ============================================================================

def init_db():
    """Initialize database"""
    with app.app_context():
        db.create_all()
        print("Database initialized successfully")

# ============================================================================
# MAIN APPLICATION
# ============================================================================

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=False)


# JWT Token Management
import jwt
import redis
from datetime import datetime, timedelta
from typing import Dict, Optional, Any
from functools import wraps
from flask import request, jsonify, current_app
import secrets
import json

class TokenManager:
    """JWT token management for financial industry standards"""
    
    def __init__(self, redis_client=None):
        self.redis_client = redis_client or redis.Redis.from_url(
            current_app.config.get('REDIS_URL', 'redis://localhost:6379'),
            decode_responses=True
        )
    
    def generate_tokens(self, user_id: str, user_data: Dict[str, Any]) -> Dict[str, str]:
        """Generate access and refresh tokens"""
        now = datetime.utcnow()
        
        # Access token payload
        access_payload = {
            'user_id': user_id,
            'email': user_data.get('email'),
            'role': user_data.get('role', 'user'),
            'permissions': user_data.get('permissions', []),
            'iat': now,
            'exp': now + current_app.config['JWT_ACCESS_TOKEN_EXPIRES'],
            'type': 'access',
            'jti': secrets.token_urlsafe(16)  # JWT ID for tracking
        }
        
        # Refresh token payload
        refresh_payload = {
            'user_id': user_id,
            'iat': now,
            'exp': now + current_app.config['JWT_REFRESH_TOKEN_EXPIRES'],
            'type': 'refresh',
            'jti': secrets.token_urlsafe(16)
        }
        
        # Generate tokens
        access_token = jwt.encode(
            access_payload,
            current_app.config['JWT_SECRET_KEY'],
            algorithm=current_app.config['JWT_ALGORITHM']
        )
        
        refresh_token = jwt.encode(
            refresh_payload,
            current_app.config['JWT_SECRET_KEY'],
            algorithm=current_app.config['JWT_ALGORITHM']
        )
        
        # Store refresh token in Redis for tracking
        self.redis_client.setex(
            f"refresh_token:{refresh_payload['jti']}",
            int(current_app.config['JWT_REFRESH_TOKEN_EXPIRES'].total_seconds()),
            json.dumps({
                'user_id': user_id,
                'created_at': now.isoformat(),
                'last_used': now.isoformat()
            })
        )
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'expires_in': int(current_app.config['JWT_ACCESS_TOKEN_EXPIRES'].total_seconds()),
            'token_type': 'Bearer'
        }
    
    def verify_token(self, token: str, token_type: str = 'access') -> Optional[Dict[str, Any]]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(
                token,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=[current_app.config['JWT_ALGORITHM']]
            )
            
            # Check token type
            if payload.get('type') != token_type:
                return None
            
            # Check if token is blacklisted
            if self.is_token_blacklisted(payload.get('jti')):
                return None
            
            # Update last used time for refresh tokens
            if token_type == 'refresh':
                self._update_refresh_token_usage(payload.get('jti'))
            
            return payload
            
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def refresh_access_token(self, refresh_token: str) -> Optional[Dict[str, str]]:
        """Generate new access token using refresh token"""
        payload = self.verify_token(refresh_token, 'refresh')
        if not payload:
            return None
        
        user_id = payload['user_id']
        
        # Get user data (you would fetch this from database)
        # For now, we'll use minimal data
        user_data = {
            'email': f"user_{user_id}@example.com",  # This should come from DB
            'role': 'user',
            'permissions': []
        }
        
        # Generate new access token only
        now = datetime.utcnow()
        access_payload = {
            'user_id': user_id,
            'email': user_data.get('email'),
            'role': user_data.get('role', 'user'),
            'permissions': user_data.get('permissions', []),
            'iat': now,
            'exp': now + current_app.config['JWT_ACCESS_TOKEN_EXPIRES'],
            'type': 'access',
            'jti': secrets.token_urlsafe(16)
        }
        
        access_token = jwt.encode(
            access_payload,
            current_app.config['JWT_SECRET_KEY'],
            algorithm=current_app.config['JWT_ALGORITHM']
        )
        
        return {
            'access_token': access_token,
            'expires_in': int(current_app.config['JWT_ACCESS_TOKEN_EXPIRES'].total_seconds()),
            'token_type': 'Bearer'
        }
    
    def blacklist_token(self, jti: str, expires_in: int = None):
        """Add token to blacklist"""
        if expires_in is None:
            expires_in = int(current_app.config['JWT_REFRESH_TOKEN_EXPIRES'].total_seconds())
        
        self.redis_client.setex(
            f"blacklist:{jti}",
            expires_in,
            datetime.utcnow().isoformat()
        )
    
    def is_token_blacklisted(self, jti: str) -> bool:
        """Check if token is blacklisted"""
        return self.redis_client.exists(f"blacklist:{jti}")
    
    def revoke_all_user_tokens(self, user_id: str):
        """Revoke all tokens for a user"""
        # Get all refresh tokens for user
        pattern = "refresh_token:*"
        for key in self.redis_client.scan_iter(match=pattern):
            token_data = self.redis_client.get(key)
            if token_data:
                data = json.loads(token_data)
                if data.get('user_id') == user_id:
                    # Extract JTI from key and blacklist
                    jti = key.split(':')[1]
                    self.blacklist_token(jti)
                    # Delete refresh token
                    self.redis_client.delete(key)
    
    def _update_refresh_token_usage(self, jti: str):
        """Update last used time for refresh token"""
        key = f"refresh_token:{jti}"
        token_data = self.redis_client.get(key)
        if token_data:
            data = json.loads(token_data)
            data['last_used'] = datetime.utcnow().isoformat()
            ttl = self.redis_client.ttl(key)
            if ttl > 0:
                self.redis_client.setex(key, ttl, json.dumps(data))

def token_required(f):
    """Decorator for token authentication with detailed logging"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            try:
                token = auth_header.split(' ')[1]  # Bearer <token>
            except IndexError:
                return jsonify({
                    'error': 'Invalid authorization header format',
                    'code': 'INVALID_AUTH_HEADER'
                }), 401
        
        if not token:
            return jsonify({
                'error': 'Access token is missing',
                'code': 'MISSING_TOKEN'
            }), 401
        
        token_manager = TokenManager()
        payload = token_manager.verify_token(token, 'access')
        
        if not payload:
            return jsonify({
                'error': 'Invalid or expired token',
                'code': 'INVALID_TOKEN'
            }), 401
        
        # Add user context to request
        request.current_user = payload
        
        # Log token usage for audit
        from src.security.audit_logger import AuditLogger
        AuditLogger.log_event(
            user_id=payload['user_id'],
            action='token_access',
            resource_type='api',
            resource_id=request.endpoint,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent'),
            additional_data={'endpoint': request.endpoint, 'method': request.method}
        )
        
        return f(*args, **kwargs)
    
    return decorated

def require_permissions(required_permissions):
    """Decorator to require specific permissions"""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if not hasattr(request, 'current_user'):
                return jsonify({
                    'error': 'Authentication required',
                    'code': 'AUTH_REQUIRED'
                }), 401
            
            user_permissions = request.current_user.get('permissions', [])
            user_role = request.current_user.get('role', 'user')
            
            # Admin role has all permissions
            if user_role == 'admin':
                return f(*args, **kwargs)
            
            # Check if user has required permissions
            if not all(perm in user_permissions for perm in required_permissions):
                return jsonify({
                    'error': 'Insufficient permissions',
                    'code': 'INSUFFICIENT_PERMISSIONS',
                    'required_permissions': required_permissions
                }), 403
            
            return f(*args, **kwargs)
        
        return decorated
    return decorator


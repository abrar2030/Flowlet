# Enhanced Rate Limiting System
import redis
import time
import json
from typing import Dict, Optional, Tuple
from flask import request, jsonify, current_app
from functools import wraps
import hashlib

class RateLimiter:
    """Enhanced rate limiting system for financial APIs"""
    
    def __init__(self, redis_client=None):
        self.redis_client = redis_client or redis.Redis.from_url(
            current_app.config.get('REDIS_URL', 'redis://localhost:6379'),
            decode_responses=True
        )
    
    def _get_client_identifier(self) -> str:
        """Get unique identifier for the client"""
        # Priority: API Key > User ID > IP Address
        api_key = request.headers.get('Authorization', '').replace('Bearer ', '')
        if api_key:
            return f"api_key:{hashlib.sha256(api_key.encode()).hexdigest()[:16]}"
        
        user_id = getattr(request, 'current_user', {}).get('user_id')
        if user_id:
            return f"user:{user_id}"
        
        return f"ip:{request.remote_addr}"
    
    def _parse_limit_string(self, limit_string: str) -> Tuple[int, int]:
        """Parse limit string like '100 per hour' to (100, 3600)"""
        parts = limit_string.lower().split()
        if len(parts) != 3 or parts[1] != 'per':
            raise ValueError(f"Invalid limit format: {limit_string}")
        
        count = int(parts[0])
        period = parts[2]
        
        period_seconds = {
            'second': 1,
            'minute': 60,
            'hour': 3600,
            'day': 86400
        }
        
        if period not in period_seconds:
            raise ValueError(f"Invalid period: {period}")
        
        return count, period_seconds[period]
    
    def is_allowed(
        self,
        limit_string: str,
        identifier: Optional[str] = None,
        endpoint: Optional[str] = None
    ) -> Tuple[bool, Dict[str, any]]:
        """Check if request is allowed under rate limit"""
        if not identifier:
            identifier = self._get_client_identifier()
        
        if not endpoint:
            endpoint = request.endpoint or 'unknown'
        
        limit_count, period_seconds = self._parse_limit_string(limit_string)
        
        # Create Redis key
        current_window = int(time.time()) // period_seconds
        key = f"rate_limit:{identifier}:{endpoint}:{current_window}"
        
        # Get current count
        current_count = self.redis_client.get(key)
        current_count = int(current_count) if current_count else 0
        
        # Check if limit exceeded
        if current_count >= limit_count:
            # Get time until reset
            time_until_reset = period_seconds - (int(time.time()) % period_seconds)
            
            return False, {
                'allowed': False,
                'limit': limit_count,
                'remaining': 0,
                'reset_time': int(time.time()) + time_until_reset,
                'retry_after': time_until_reset
            }
        
        # Increment counter
        pipe = self.redis_client.pipeline()
        pipe.incr(key)
        pipe.expire(key, period_seconds)
        pipe.execute()
        
        remaining = limit_count - (current_count + 1)
        time_until_reset = period_seconds - (int(time.time()) % period_seconds)
        
        return True, {
            'allowed': True,
            'limit': limit_count,
            'remaining': remaining,
            'reset_time': int(time.time()) + time_until_reset,
            'retry_after': 0
        }
    
    def get_usage_stats(
        self,
        identifier: Optional[str] = None,
        endpoint: Optional[str] = None,
        period_seconds: int = 3600
    ) -> Dict[str, any]:
        """Get usage statistics for monitoring"""
        if not identifier:
            identifier = self._get_client_identifier()
        
        if not endpoint:
            endpoint = request.endpoint or 'unknown'
        
        current_window = int(time.time()) // period_seconds
        key = f"rate_limit:{identifier}:{endpoint}:{current_window}"
        
        current_count = self.redis_client.get(key)
        current_count = int(current_count) if current_count else 0
        
        return {
            'identifier': identifier,
            'endpoint': endpoint,
            'current_usage': current_count,
            'window_start': current_window * period_seconds,
            'window_end': (current_window + 1) * period_seconds
        }

def rate_limit(limit_string: str, per_endpoint: bool = True, custom_key: Optional[str] = None):
    """Decorator for rate limiting endpoints"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            limiter = RateLimiter()
            
            # Determine endpoint key
            endpoint = custom_key if custom_key else (request.endpoint if per_endpoint else 'global')
            
            # Check rate limit
            allowed, info = limiter.is_allowed(limit_string, endpoint=endpoint)
            
            if not allowed:
                # Log rate limit violation
                from src.security.audit_logger import AuditLogger
                AuditLogger.log_event(
                    user_id=getattr(request, 'current_user', {}).get('user_id'),
                    action='rate_limit_exceeded',
                    resource_type='api_endpoint',
                    resource_id=endpoint,
                    additional_data={
                        'limit': info['limit'],
                        'retry_after': info['retry_after']
                    },
                    risk_score=30,
                    is_suspicious=True
                )
                
                response = jsonify({
                    'error': 'Rate limit exceeded',
                    'code': 'RATE_LIMIT_EXCEEDED',
                    'limit': info['limit'],
                    'retry_after': info['retry_after']
                })
                response.status_code = 429
                response.headers['X-RateLimit-Limit'] = str(info['limit'])
                response.headers['X-RateLimit-Remaining'] = str(info['remaining'])
                response.headers['X-RateLimit-Reset'] = str(info['reset_time'])
                response.headers['Retry-After'] = str(info['retry_after'])
                return response
            
            # Add rate limit headers to successful responses
            response = f(*args, **kwargs)
            if hasattr(response, 'headers'):
                response.headers['X-RateLimit-Limit'] = str(info['limit'])
                response.headers['X-RateLimit-Remaining'] = str(info['remaining'])
                response.headers['X-RateLimit-Reset'] = str(info['reset_time'])
            
            return response
        
        return decorated_function
    return decorator

class AdaptiveRateLimiter(RateLimiter):
    """Adaptive rate limiter that adjusts limits based on user behavior"""
    
    def __init__(self, redis_client=None):
        super().__init__(redis_client)
        self.base_limits = {
            'new_user': '50 per hour',
            'verified_user': '200 per hour',
            'premium_user': '500 per hour',
            'suspicious_user': '10 per hour'
        }
    
    def get_user_tier(self, user_id: str) -> str:
        """Determine user tier based on account status and behavior"""
        # This would typically query the database for user information
        # For now, we'll use a simple heuristic
        
        # Check for suspicious activity
        suspicious_key = f"suspicious_activity:{user_id}"
        if self.redis_client.exists(suspicious_key):
            return 'suspicious_user'
        
        # Check account age and verification status
        # This would come from the database in a real implementation
        return 'verified_user'  # Default
    
    def get_adaptive_limit(self, user_id: str, endpoint: str) -> str:
        """Get adaptive rate limit based on user tier and endpoint"""
        user_tier = self.get_user_tier(user_id)
        base_limit = self.base_limits.get(user_tier, self.base_limits['verified_user'])
        
        # Adjust limits for specific endpoints
        endpoint_multipliers = {
            'auth.login': 0.1,  # Stricter for auth endpoints
            'payment.deposit': 0.5,  # Stricter for financial endpoints
            'payment.withdraw': 0.3,
            'wallet.transfer': 0.4,
            'kyc.verification': 0.2
        }
        
        if endpoint in endpoint_multipliers:
            limit_count, period = self._parse_limit_string(base_limit)
            adjusted_count = max(1, int(limit_count * endpoint_multipliers[endpoint]))
            period_name = {60: 'minute', 3600: 'hour', 86400: 'day'}.get(period, 'hour')
            return f"{adjusted_count} per {period_name}"
        
        return base_limit
    
    def mark_suspicious_activity(self, user_id: str, duration_hours: int = 24):
        """Mark user as suspicious for adaptive rate limiting"""
        suspicious_key = f"suspicious_activity:{user_id}"
        self.redis_client.setex(suspicious_key, duration_hours * 3600, "1")
        
        # Log the event
        from src.security.audit_logger import AuditLogger
        AuditLogger.log_event(
            user_id=user_id,
            action='marked_suspicious',
            resource_type='user_account',
            resource_id=user_id,
            additional_data={'duration_hours': duration_hours},
            risk_score=70,
            is_suspicious=True
        )

def adaptive_rate_limit(endpoint_name: Optional[str] = None):
    """Decorator for adaptive rate limiting based on user behavior"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            limiter = AdaptiveRateLimiter()
            
            # Get user ID from request context
            user_id = getattr(request, 'current_user', {}).get('user_id')
            if not user_id:
                # Fall back to IP-based limiting for unauthenticated requests
                return rate_limit('100 per hour')(f)(*args, **kwargs)
            
            # Get adaptive limit
            endpoint = endpoint_name or request.endpoint
            adaptive_limit = limiter.get_adaptive_limit(user_id, endpoint)
            
            # Apply the adaptive limit
            return rate_limit(adaptive_limit)(f)(*args, **kwargs)
        
        return decorated_function
    return decorator

# Middleware for global rate limiting
class GlobalRateLimitMiddleware:
    """Global rate limiting middleware"""
    
    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        app.before_request(self.before_request)
    
    def before_request(self):
        """Apply global rate limiting before each request"""
        # Skip rate limiting for health checks and static files
        if request.endpoint in ['health', 'static']:
            return
        
        limiter = RateLimiter()
        
        # Apply global rate limit
        allowed, info = limiter.is_allowed('10000 per hour', endpoint='global')
        
        if not allowed:
            response = jsonify({
                'error': 'Global rate limit exceeded',
                'code': 'GLOBAL_RATE_LIMIT_EXCEEDED',
                'retry_after': info['retry_after']
            })
            response.status_code = 429
            response.headers['Retry-After'] = str(info['retry_after'])
            return response


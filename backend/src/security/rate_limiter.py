"""
Advanced rate limiter for financial applications
"""

import time
import redis
from flask import request, jsonify, current_app
from functools import wraps
from datetime import datetime, timedelta
import hashlib

class RateLimiter:
    """Advanced rate limiting with multiple strategies"""
    
    def __init__(self, redis_client=None):
        self.redis_client = redis_client
        self.memory_store = {}  # Fallback for when Redis is not available
    
    def _get_client_id(self):
        """Get unique client identifier"""
        # Use IP address and User-Agent for identification
        ip = request.remote_addr
        user_agent = request.headers.get('User-Agent', '')
        
        # Create hash for privacy
        client_string = f"{ip}:{user_agent}"
        return hashlib.sha256(client_string.encode()).hexdigest()[:16]
    
    def _get_key(self, identifier, window_type):
        """Generate Redis key for rate limiting"""
        timestamp = int(time.time())
        
        if window_type == 'minute':
            window = timestamp // 60
        elif window_type == 'hour':
            window = timestamp // 3600
        elif window_type == 'day':
            window = timestamp // 86400
        else:
            window = timestamp // 60  # Default to minute
        
        return f"rate_limit:{identifier}:{window_type}:{window}"
    
    def _check_redis_limit(self, key, limit, window_seconds):
        """Check rate limit using Redis"""
        try:
            current_count = self.redis_client.get(key)
            
            if current_count is None:
                # First request in this window
                self.redis_client.setex(key, window_seconds, 1)
                return True, 1, limit
            
            current_count = int(current_count)
            
            if current_count >= limit:
                return False, current_count, limit
            
            # Increment counter
            self.redis_client.incr(key)
            return True, current_count + 1, limit
            
        except Exception as e:
            current_app.logger.error(f"Redis rate limiting error: {str(e)}")
            return True, 0, limit  # Allow request if Redis fails
    
    def _check_memory_limit(self, key, limit, window_seconds):
        """Check rate limit using memory store (fallback)"""
        now = time.time()
        
        # Clean old entries
        self.memory_store = {
            k: v for k, v in self.memory_store.items()
            if now - v['timestamp'] < window_seconds
        }
        
        if key not in self.memory_store:
            self.memory_store[key] = {'count': 1, 'timestamp': now}
            return True, 1, limit
        
        entry = self.memory_store[key]
        
        if entry['count'] >= limit:
            return False, entry['count'], limit
        
        entry['count'] += 1
        return True, entry['count'], limit
    
    def check_rate_limit(self, identifier, limits):
        """
        Check multiple rate limits
        
        Args:
            identifier: Unique identifier for the client
            limits: Dict with rate limits, e.g., {'minute': 10, 'hour': 100}
        
        Returns:
            Tuple: (allowed, current_counts, limits_info)
        """
        current_counts = {}
        limits_info = {}
        
        for window_type, limit in limits.items():
            key = self._get_key(identifier, window_type)
            
            if window_type == 'minute':
                window_seconds = 60
            elif window_type == 'hour':
                window_seconds = 3600
            elif window_type == 'day':
                window_seconds = 86400
            else:
                window_seconds = 60
            
            if self.redis_client:
                allowed, current, max_limit = self._check_redis_limit(key, limit, window_seconds)
            else:
                allowed, current, max_limit = self._check_memory_limit(key, limit, window_seconds)
            
            current_counts[window_type] = current
            limits_info[window_type] = max_limit
            
            if not allowed:
                return False, current_counts, limits_info
        
        return True, current_counts, limits_info
    
    def rate_limit(self, **limits):
        """
        Decorator for rate limiting endpoints
        
        Usage:
            @rate_limit(minute=10, hour=100)
            def my_endpoint():
                pass
        """
        def decorator(f):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                client_id = self._get_client_id()
                
                allowed, current_counts, limits_info = self.check_rate_limit(client_id, limits)
                
                if not allowed:
                    # Log rate limit violation
                    current_app.audit_logger.log_security_event(
                        f"Rate limit exceeded for client {client_id}",
                        ip_address=request.remote_addr,
                        severity="HIGH"
                    )
                    
                    # Calculate retry after
                    retry_after = 60  # Default to 1 minute
                    
                    response = jsonify({
                        'error': 'Rate Limit Exceeded',
                        'message': 'Too many requests. Please try again later.',
                        'code': 'RATE_LIMIT_EXCEEDED',
                        'retry_after': retry_after,
                        'current_limits': current_counts,
                        'max_limits': limits_info,
                        'timestamp': datetime.utcnow().isoformat()
                    })
                    
                    response.status_code = 429
                    response.headers['Retry-After'] = str(retry_after)
                    response.headers['X-RateLimit-Limit'] = str(max(limits_info.values()))
                    response.headers['X-RateLimit-Remaining'] = '0'
                    response.headers['X-RateLimit-Reset'] = str(int(time.time()) + retry_after)
                    
                    return response
                
                # Add rate limit headers to successful responses
                response = f(*args, **kwargs)
                
                if hasattr(response, 'headers'):
                    max_limit = max(limits_info.values())
                    current_max = max(current_counts.values())
                    
                    response.headers['X-RateLimit-Limit'] = str(max_limit)
                    response.headers['X-RateLimit-Remaining'] = str(max_limit - current_max)
                    response.headers['X-RateLimit-Reset'] = str(int(time.time()) + 3600)
                
                return response
            
            return decorated_function
        return decorator

# Predefined rate limit decorators for common use cases
def auth_rate_limit(f):
    """Rate limit for authentication endpoints"""
    limiter = RateLimiter()
    return limiter.rate_limit(minute=5, hour=20)(f)

def transaction_rate_limit(f):
    """Rate limit for transaction endpoints"""
    limiter = RateLimiter()
    return limiter.rate_limit(minute=10, hour=100, day=500)(f)

def api_rate_limit(f):
    """Standard rate limit for API endpoints"""
    limiter = RateLimiter()
    return limiter.rate_limit(minute=60, hour=1000)(f)

def admin_rate_limit(f):
    """Rate limit for admin endpoints"""
    limiter = RateLimiter()
    return limiter.rate_limit(minute=30, hour=200)(f)


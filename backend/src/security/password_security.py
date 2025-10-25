# Password Security Module
import bcrypt
import re
import secrets
import string
from datetime import datetime, timedelta
from typing import List, Optional

class PasswordSecurity:
    """Password security for financial industry standards"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using bcrypt with salt"""
        salt = bcrypt.gensalt(rounds=12)  # Higher rounds for better security
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    @staticmethod
    def validate_password_strength(password: str) -> tuple[bool, List[str]]:
        """Validate password meets financial industry requirements"""
        errors = []
        
        if len(password) < 12:
            errors.append("Password must be at least 12 characters long")
        
        if not re.search(r'[A-Z]', password):
            errors.append("Password must contain at least one uppercase letter")
        
        if not re.search(r'[a-z]', password):
            errors.append("Password must contain at least one lowercase letter")
        
        if not re.search(r'\d', password):
            errors.append("Password must contain at least one number")
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append("Password must contain at least one special character")
        
        # Check for common patterns
        if re.search(r'(.)\1{2,}', password):
            errors.append("Password cannot contain repeated characters")
        
        if re.search(r'(012|123|234|345|456|567|678|789|890)', password):
            errors.append("Password cannot contain sequential numbers")
        
        if re.search(r'(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)', password.lower()):
            errors.append("Password cannot contain sequential letters")
        
        # Check against common passwords
        common_passwords = [
            'password', '123456', 'password123', 'admin', 'qwerty',
            'letmein', 'welcome', 'monkey', '1234567890', 'password1'
        ]
        
        if password.lower() in common_passwords:
            errors.append("Password cannot be a common password")
        
        return len(errors) == 0, errors
    
    @staticmethod
    def generate_secure_password(length: int = 16) -> str:
        """Generate a cryptographically secure password"""
        if length < 12:
            length = 12
        
        # Ensure at least one character from each required category
        password = [
            secrets.choice(string.ascii_uppercase),
            secrets.choice(string.ascii_lowercase),
            secrets.choice(string.digits),
            secrets.choice('!@#$%^&*(),.?":{}|<>')
        ]
        
        # Fill the rest with random characters
        all_chars = string.ascii_letters + string.digits + '!@#$%^&*(),.?":{}|<>'
        for _ in range(length - 4):
            password.append(secrets.choice(all_chars))
        
        # Shuffle the password
        secrets.SystemRandom().shuffle(password)
        
        return ''.join(password)
    
    @staticmethod
    def check_password_history(new_password: str, password_history: List[str]) -> bool:
        """Check if password was used recently"""
        for old_hash in password_history:
            if PasswordSecurity.verify_password(new_password, old_hash):
                return False
        return True
    
    @staticmethod
    def is_password_expired(last_changed: datetime, max_age_days: int = 90) -> bool:
        """Check if password has expired"""
        if not last_changed:
            return True
        
        expiry_date = last_changed + timedelta(days=max_age_days)
        return datetime.utcnow() > expiry_date
    
    @staticmethod
    def calculate_password_entropy(password: str) -> float:
        """Calculate password entropy for strength assessment"""
        charset_size = 0
        
        if re.search(r'[a-z]', password):
            charset_size += 26
        if re.search(r'[A-Z]', password):
            charset_size += 26
        if re.search(r'\d', password):
            charset_size += 10
        if re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            charset_size += 32
        
        if charset_size == 0:
            return 0
        
        import math
        return len(password) * math.log2(charset_size)
    
    @staticmethod
    def get_password_strength_score(password: str) -> tuple[int, str]:
        """Get password strength score (0-100) and description"""
        entropy = PasswordSecurity.calculate_password_entropy(password)
        
        if entropy < 30:
            return 0, "Very Weak"
        elif entropy < 50:
            return 25, "Weak"
        elif entropy < 70:
            return 50, "Fair"
        elif entropy < 90:
            return 75, "Good"
        else:
            return 100, "Excellent"


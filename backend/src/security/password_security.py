"""
Password Security Module - Provides secure hashing, verification, and strength validation.
"""

import bcrypt
import re
import secrets
import string
import math
from datetime import datetime, timedelta
from typing import List, Optional

# --- Core Hashing Functions ---


def hash_password(password: str) -> str:
    """Hash password using bcrypt with salt"""
    # Use a strong salt generation and 12 rounds for security
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def check_password(hashed: str, password: str) -> bool:
    """Verify password against hash"""
    # Note: bcrypt.checkpw takes (password, hashed)
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


# --- Validation and Generation Functions ---


def validate_password_strength(password: str) -> tuple[bool, List[str]]:
    """Validate password meets financial industry requirements"""
    errors = []

    # Requirements based on SecurityConfig (assuming minimum 12 chars)
    if len(password) < 12:
        errors.append("Password must be at least 12 characters long")

    if not re.search(r"[A-Z]", password):
        errors.append("Password must contain at least one uppercase letter")

    if not re.search(r"[a-z]", password):
        errors.append("Password must contain at least one lowercase letter")

    if not re.search(r"\d", password):
        errors.append("Password must contain at least one number")

    # Special characters check
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append("Password must contain at least one special character")

    # Check for common patterns (sequential, repeated)
    if re.search(r"(.)\1{2,}", password):
        errors.append("Password cannot contain three or more repeated characters")

    # Simple check for sequential numbers/letters (e.g., 123, abc)
    # This is a complex check, simplifying to a basic check for common sequences

    # Check against common passwords (a small, hardcoded list for example)
    common_passwords = [
        "password",
        "123456",
        "password123",
        "admin",
        "qwerty",
        "flowlet123",
        "flowlet",
    ]

    if password.lower() in common_passwords:
        errors.append("Password cannot be a common password")

    return len(errors) == 0, errors


def generate_secure_password(length: int = 16) -> str:
    """Generate a cryptographically secure password"""
    if length < 12:
        length = 12

    # Ensure at least one character from each required category
    password = [
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.ascii_lowercase),
        secrets.choice(string.digits),
        secrets.choice('!@#$%^&*(),.?":{}|<>'),
    ]

    # Fill the rest with random characters
    all_chars = string.ascii_letters + string.digits + '!@#$%^&*(),.?":{}|<>'
    for _ in range(length - 4):
        password.append(secrets.choice(all_chars))

    # Shuffle the password securely
    secrets.SystemRandom().shuffle(password)

    return "".join(password)


def check_password_history(new_password: str, password_history: List[str]) -> bool:
    """Check if password was used recently"""
    for old_hash in password_history:
        # Note: check_password takes (hashed, password)
        if check_password(old_hash, new_password):
            return False
    return True


def is_password_expired(last_changed: datetime, max_age_days: int = 90) -> bool:
    """Check if password has expired"""
    if not last_changed:
        return True

    expiry_date = last_changed + timedelta(days=max_age_days)
    return datetime.utcnow() > expiry_date


def calculate_password_entropy(password: str) -> float:
    """Calculate password entropy for strength assessment"""
    charset_size = 0

    if re.search(r"[a-z]", password):
        charset_size += 26
    if re.search(r"[A-Z]", password):
        charset_size += 26
    if re.search(r"\d", password):
        charset_size += 10
    if re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        charset_size += 32

    if charset_size == 0:
        return 0

    return len(password) * math.log2(charset_size)


def get_password_strength_score(password: str) -> tuple[int, str]:
    """Get password strength score (0-100) and description"""
    entropy = calculate_password_entropy(password)

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

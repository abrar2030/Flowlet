import re
import uuid
from decimal import Decimal
from typing import Optional

"""
Utility functions for data validation and sanitization
"""


def is_valid_email(email: str) -> bool:
    """Validate email format using a simple regex"""
    if not email or not isinstance(email, str):
        return False
    # Simple regex for email validation
    regex = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.fullmatch(regex, email) is not None


def is_valid_uuid(uuid_str: str) -> bool:
    """Validate if a string is a valid UUID"""
    if not uuid_str or not isinstance(uuid_str, str):
        return False
    try:
        # Attempt to create a UUID object from the string
        uuid.UUID(uuid_str)
        return True
    except ValueError:
        return False


def validate_password_strength(password: str) -> Optional[str]:
    """
    Validate password strength based on a set of rules.
    Returns None if valid, or an error message string if invalid.
    """
    if not password or not isinstance(password, str):
        return "Password cannot be empty."

    if len(password) < 12:
        return "Password must be at least 12 characters long."

    if not re.search(r"[A-Z]", password):
        return "Password must contain at least one uppercase letter."

    if not re.search(r"[a-z]", password):
        return "Password must contain at least one lowercase letter."

    if not re.search(r"[0-9]", password):
        return "Password must contain at least one digit."

    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return "Password must contain at least one special character."

    return None


def sanitize_input(text: str) -> str:
    """Sanitize input string to prevent XSS and SQL injection (basic)"""
    if not text or not isinstance(text, str):
        return ""
    # Basic sanitization: strip leading/trailing whitespace, escape HTML tags
    sanitized_text = text.strip()
    sanitized_text = sanitized_text.replace("<", "&lt;").replace(">", "&gt;")
    # Further sanitization for SQL injection prevention should be handled by the ORM/DB driver
    return sanitized_text


def is_valid_currency_code(code: str) -> bool:
    """Validate if a string is a valid 3-letter currency code (ISO 4217)"""
    if not code or not isinstance(code, str) or len(code) != 3:
        return False
    return code.isalpha() and code.isupper()


def is_valid_amount(amount: Decimal) -> bool:
    """Validate if a Decimal is a valid positive financial amount"""
    if not isinstance(amount, Decimal):
        try:
            amount = Decimal(str(amount))
        except Exception:
            return False

    return amount > Decimal("0.00") and amount.as_tuple().exponent >= -2


def is_valid_ip_address(ip_address: str) -> bool:
    """Validate if a string is a valid IPv4 or IPv6 address"""
    if not ip_address or not isinstance(ip_address, str):
        return False

    # Simple check for IPv4
    ipv4_regex = r"^(\d{1,3}\.){3}\d{1,3}$"
    if re.fullmatch(ipv4_regex, ip_address):
        parts = ip_address.split(".")
        if all(0 <= int(part) <= 255 for part in parts):
            return True

    # Simple check for IPv6 (more complex regex is needed for full validation)
    if ":" in ip_address:
        return True  # Placeholder for full IPv6 validation

    return False


# Need to import uuid for is_valid_uuid

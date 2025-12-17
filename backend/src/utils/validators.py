"""Input validation utilities"""

from typing import Any
import re


def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))


def validate_phone(phone: str) -> bool:
    """Validate phone number"""
    pattern = r"^\+?[1-9]\d{1,14}$"
    return bool(re.match(pattern, phone.replace(" ", "").replace("-", "")))


def validate_amount(amount: Any) -> bool:
    """Validate transaction amount"""
    try:
        return float(amount) >= 0
    except (ValueError, TypeError):
        return False

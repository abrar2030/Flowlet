"""Input validation utilities"""

from typing import Any, Optional
import re
from decimal import Decimal


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


class InputValidator:
    """Class-based input validator with various validation methods"""

    @staticmethod
    def validate_email(email: str) -> tuple[bool, Optional[str]]:
        """Validate email format"""
        if not email or not isinstance(email, str):
            return False, "Email is required"
        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(pattern, email):
            return False, "Invalid email format"
        return True, None

    @staticmethod
    def validate_phone(phone: str) -> tuple[bool, Optional[str]]:
        """Validate phone number"""
        if not phone or not isinstance(phone, str):
            return False, "Phone number is required"
        pattern = r"^\+?[1-9]\d{1,14}$"
        cleaned = phone.replace(" ", "").replace("-", "")
        if not re.match(pattern, cleaned):
            return False, "Invalid phone number format"
        return True, None

    @staticmethod
    def validate_amount(
        amount: Any, min_amount: Decimal = Decimal("0.01")
    ) -> tuple[bool, Optional[str]]:
        """Validate transaction amount"""
        try:
            amt = Decimal(str(amount))
            if amt < min_amount:
                return False, f"Amount must be at least {min_amount}"
            return True, None
        except (ValueError, TypeError):
            return False, "Invalid amount format"

    @staticmethod
    def validate_currency(currency: str) -> tuple[bool, Optional[str]]:
        """Validate currency code"""
        if not currency or len(currency) != 3:
            return False, "Currency must be a 3-letter code"
        return True, None

    @staticmethod
    def validate_required(value: Any, field_name: str) -> tuple[bool, Optional[str]]:
        """Validate required field"""
        if value is None or (isinstance(value, str) and not value.strip()):
            return False, f"{field_name} is required"
        return True, None

    @staticmethod
    def validate_string_length(
        value: str, min_len: int = 0, max_len: int = 255
    ) -> tuple[bool, Optional[str]]:
        """Validate string length"""
        if not isinstance(value, str):
            return False, "Value must be a string"
        if len(value) < min_len:
            return False, f"Value must be at least {min_len} characters"
        if len(value) > max_len:
            return False, f"Value must be at most {max_len} characters"
        return True, None

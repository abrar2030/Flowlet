# Enhanced Input Validation and Sanitization
import re
import html
import bleach
from typing import Any, Dict, List, Optional, Union
from decimal import Decimal, InvalidOperation
from datetime import datetime
import phonenumbers
from email_validator import validate_email, EmailNotValidError

class ValidationError(Exception):
    """Custom validation error"""
    def __init__(self, field: str, message: str, code: str = None):
        self.field = field
        self.message = message
        self.code = code
        super().__init__(f"{field}: {message}")

class InputValidator:
    """Enhanced input validation for financial industry standards"""
    
    # Common regex patterns
    PATTERNS = {
        'uuid': r'^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
        'card_number': r'^\d{13,19}$',
        'cvv': r'^\d{3,4}$',
        'routing_number': r'^\d{9}$',
        'account_number': r'^[0-9]{8,17}$',
        'ssn': r'^\d{3}-?\d{2}-?\d{4}$',
        'ein': r'^\d{2}-?\d{7}$',
        'swift_code': r'^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$',
        'iban': r'^[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}$',
        'currency_code': r'^[A-Z]{3}$',
        'country_code': r'^[A-Z]{2}$',
        'ip_address': r'^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$',
        'ipv6_address': r'^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$'
    }
    
    @staticmethod
    def validate_string(
        value: Any,
        field_name: str,
        min_length: int = 0,
        max_length: int = 255,
        pattern: Optional[str] = None,
        allowed_chars: Optional[str] = None,
        required: bool = True
    ) -> str:
        """Validate string input"""
        if value is None or value == "":
            if required:
                raise ValidationError(field_name, "Field is required", "REQUIRED")
            return ""
        
        if not isinstance(value, str):
            value = str(value)
        
        # Sanitize HTML
        value = html.escape(value)
        
        # Check length
        if len(value) < min_length:
            raise ValidationError(
                field_name,
                f"Must be at least {min_length} characters long",
                "MIN_LENGTH"
            )
        
        if len(value) > max_length:
            raise ValidationError(
                field_name,
                f"Must be no more than {max_length} characters long",
                "MAX_LENGTH"
            )
        
        # Check pattern
        if pattern and not re.match(pattern, value):
            raise ValidationError(
                field_name,
                "Invalid format",
                "INVALID_FORMAT"
            )
        
        # Check allowed characters
        if allowed_chars and not all(c in allowed_chars for c in value):
            raise ValidationError(
                field_name,
                "Contains invalid characters",
                "INVALID_CHARS"
            )
        
        return value
    
    @staticmethod
    def validate_email(value: Any, field_name: str, required: bool = True) -> str:
        """Validate email address"""
        if value is None or value == "":
            if required:
                raise ValidationError(field_name, "Email is required", "REQUIRED")
            return ""
        
        try:
            # Use email-validator library for comprehensive validation
            validated_email = validate_email(value)
            return validated_email.email
        except EmailNotValidError as e:
            raise ValidationError(field_name, str(e), "INVALID_EMAIL")
    
    @staticmethod
    def validate_phone(value: Any, field_name: str, required: bool = True) -> str:
        """Validate phone number"""
        if value is None or value == "":
            if required:
                raise ValidationError(field_name, "Phone number is required", "REQUIRED")
            return ""
        
        try:
            # Parse and validate phone number
            parsed_number = phonenumbers.parse(value, None)
            if not phonenumbers.is_valid_number(parsed_number):
                raise ValidationError(field_name, "Invalid phone number", "INVALID_PHONE")
            
            # Return in international format
            return phonenumbers.format_number(parsed_number, phonenumbers.PhoneNumberFormat.E164)
        except phonenumbers.NumberParseException:
            raise ValidationError(field_name, "Invalid phone number format", "INVALID_PHONE_FORMAT")
    
    @staticmethod
    def validate_decimal(
        value: Any,
        field_name: str,
        min_value: Optional[Decimal] = None,
        max_value: Optional[Decimal] = None,
        decimal_places: int = 2,
        required: bool = True
    ) -> Decimal:
        """Validate decimal/monetary value"""
        if value is None or value == "":
            if required:
                raise ValidationError(field_name, "Value is required", "REQUIRED")
            return Decimal('0.00')
        
        try:
            if isinstance(value, str):
                # Remove common formatting characters
                value = value.replace(',', '').replace('$', '').strip()
            
            decimal_value = Decimal(str(value))
            
            # Check decimal places
            if decimal_value.as_tuple().exponent < -decimal_places:
                raise ValidationError(
                    field_name,
                    f"Cannot have more than {decimal_places} decimal places",
                    "INVALID_PRECISION"
                )
            
            # Check range
            if min_value is not None and decimal_value < min_value:
                raise ValidationError(
                    field_name,
                    f"Must be at least {min_value}",
                    "MIN_VALUE"
                )
            
            if max_value is not None and decimal_value > max_value:
                raise ValidationError(
                    field_name,
                    f"Must be no more than {max_value}",
                    "MAX_VALUE"
                )
            
            return decimal_value
            
        except (InvalidOperation, ValueError):
            raise ValidationError(field_name, "Invalid decimal value", "INVALID_DECIMAL")
    
    @staticmethod
    def validate_integer(
        value: Any,
        field_name: str,
        min_value: Optional[int] = None,
        max_value: Optional[int] = None,
        required: bool = True
    ) -> int:
        """Validate integer value"""
        if value is None or value == "":
            if required:
                raise ValidationError(field_name, "Value is required", "REQUIRED")
            return 0
        
        try:
            int_value = int(value)
            
            if min_value is not None and int_value < min_value:
                raise ValidationError(
                    field_name,
                    f"Must be at least {min_value}",
                    "MIN_VALUE"
                )
            
            if max_value is not None and int_value > max_value:
                raise ValidationError(
                    field_name,
                    f"Must be no more than {max_value}",
                    "MAX_VALUE"
                )
            
            return int_value
            
        except (ValueError, TypeError):
            raise ValidationError(field_name, "Invalid integer value", "INVALID_INTEGER")
    
    @staticmethod
    def validate_date(value: Any, field_name: str, required: bool = True) -> datetime:
        """Validate date value"""
        if value is None or value == "":
            if required:
                raise ValidationError(field_name, "Date is required", "REQUIRED")
            return None
        
        if isinstance(value, datetime):
            return value
        
        # Try to parse string date
        date_formats = [
            '%Y-%m-%d',
            '%Y-%m-%d %H:%M:%S',
            '%Y-%m-%dT%H:%M:%S',
            '%Y-%m-%dT%H:%M:%SZ',
            '%m/%d/%Y',
            '%d/%m/%Y'
        ]
        
        for fmt in date_formats:
            try:
                return datetime.strptime(str(value), fmt)
            except ValueError:
                continue
        
        raise ValidationError(field_name, "Invalid date format", "INVALID_DATE")
    
    @staticmethod
    def validate_card_number(value: Any, field_name: str, required: bool = True) -> str:
        """Validate credit card number using Luhn algorithm"""
        if value is None or value == "":
            if required:
                raise ValidationError(field_name, "Card number is required", "REQUIRED")
            return ""
        
        # Remove spaces and dashes
        card_number = re.sub(r'[\s-]', '', str(value))
        
        # Check format
        if not re.match(InputValidator.PATTERNS['card_number'], card_number):
            raise ValidationError(field_name, "Invalid card number format", "INVALID_FORMAT")
        
        # Luhn algorithm validation
        def luhn_check(card_num):
            def digits_of(n):
                return [int(d) for d in str(n)]
            
            digits = digits_of(card_num)
            odd_digits = digits[-1::-2]
            even_digits = digits[-2::-2]
            checksum = sum(odd_digits)
            for d in even_digits:
                checksum += sum(digits_of(d * 2))
            return checksum % 10 == 0
        
        if not luhn_check(card_number):
            raise ValidationError(field_name, "Invalid card number", "INVALID_CARD")
        
        return card_number
    
    @staticmethod
    def validate_currency_code(value: Any, field_name: str, required: bool = True) -> str:
        """Validate ISO 4217 currency code"""
        if value is None or value == "":
            if required:
                raise ValidationError(field_name, "Currency code is required", "REQUIRED")
            return ""
        
        currency_code = str(value).upper()
        
        if not re.match(InputValidator.PATTERNS['currency_code'], currency_code):
            raise ValidationError(field_name, "Invalid currency code format", "INVALID_FORMAT")
        
        # List of common currency codes (in production, use a complete list)
        valid_currencies = {
            'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SEK', 'NZD',
            'MXN', 'SGD', 'HKD', 'NOK', 'TRY', 'ZAR', 'BRL', 'INR', 'KRW', 'PLN'
        }
        
        if currency_code not in valid_currencies:
            raise ValidationError(field_name, "Unsupported currency code", "UNSUPPORTED_CURRENCY")
        
        return currency_code
    
    @staticmethod
    def sanitize_html(value: str, allowed_tags: List[str] = None) -> str:
        """Sanitize HTML content"""
        if allowed_tags is None:
            allowed_tags = []  # No HTML tags allowed by default
        
        return bleach.clean(value, tags=allowed_tags, strip=True)
    
    @staticmethod
    def validate_json_schema(data: Dict[str, Any], schema: Dict[str, Any]) -> Dict[str, Any]:
        """Validate data against a JSON schema"""
        validated_data = {}
        errors = []
        
        for field_name, field_config in schema.items():
            field_type = field_config.get('type', 'string')
            required = field_config.get('required', False)
            value = data.get(field_name)
            
            try:
                if field_type == 'string':
                    validated_data[field_name] = InputValidator.validate_string(
                        value, field_name,
                        min_length=field_config.get('min_length', 0),
                        max_length=field_config.get('max_length', 255),
                        pattern=field_config.get('pattern'),
                        required=required
                    )
                elif field_type == 'email':
                    validated_data[field_name] = InputValidator.validate_email(
                        value, field_name, required
                    )
                elif field_type == 'phone':
                    validated_data[field_name] = InputValidator.validate_phone(
                        value, field_name, required
                    )
                elif field_type == 'decimal':
                    validated_data[field_name] = InputValidator.validate_decimal(
                        value, field_name,
                        min_value=field_config.get('min_value'),
                        max_value=field_config.get('max_value'),
                        decimal_places=field_config.get('decimal_places', 2),
                        required=required
                    )
                elif field_type == 'integer':
                    validated_data[field_name] = InputValidator.validate_integer(
                        value, field_name,
                        min_value=field_config.get('min_value'),
                        max_value=field_config.get('max_value'),
                        required=required
                    )
                elif field_type == 'date':
                    validated_data[field_name] = InputValidator.validate_date(
                        value, field_name, required
                    )
                elif field_type == 'card_number':
                    validated_data[field_name] = InputValidator.validate_card_number(
                        value, field_name, required
                    )
                elif field_type == 'currency':
                    validated_data[field_name] = InputValidator.validate_currency_code(
                        value, field_name, required
                    )
                
            except ValidationError as e:
                errors.append(e)
        
        if errors:
            raise ValidationError("validation_failed", f"Validation failed: {[str(e) for e in errors]}")
        
        return validated_data


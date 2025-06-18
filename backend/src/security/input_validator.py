"""
Advanced Input Validation and Sanitization System
"""

import re
import html
import json
import ipaddress
from typing import Any, Dict, List, Optional, Union
from datetime import datetime, date
from decimal import Decimal, InvalidOperation
from email_validator import validate_email, EmailNotValidError
import phonenumbers
from phonenumbers import NumberParseException
import logging

logger = logging.getLogger(__name__)

class ValidationError(Exception):
    """Custom validation error"""
    def __init__(self, message: str, field: str = None, code: str = None):
        self.message = message
        self.field = field
        self.code = code
        super().__init__(message)

class InputValidator:
    """Comprehensive input validation and sanitization"""
    
    def __init__(self):
        # Common regex patterns
        self.patterns = {
            'alphanumeric': re.compile(r'^[a-zA-Z0-9]+$'),
            'alpha': re.compile(r'^[a-zA-Z]+$'),
            'numeric': re.compile(r'^[0-9]+$'),
            'uuid': re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE),
            'card_number': re.compile(r'^[0-9]{13,19}$'),
            'cvv': re.compile(r'^[0-9]{3,4}$'),
            'pin': re.compile(r'^[0-9]{4}$'),
            'routing_number': re.compile(r'^[0-9]{9}$'),
            'swift_code': re.compile(r'^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$'),
            'iban': re.compile(r'^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$'),
            'ssn': re.compile(r'^[0-9]{3}-[0-9]{2}-[0-9]{4}$'),
            'ein': re.compile(r'^[0-9]{2}-[0-9]{7}$'),
            'ip_address': re.compile(r'^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$'),
            'url': re.compile(r'^https?://(?:[-\w.])+(?:[:\d]+)?(?:/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:\w*))?)?$'),
            'base64': re.compile(r'^[A-Za-z0-9+/]*={0,2}$'),
            'hex': re.compile(r'^[0-9a-fA-F]+$'),
            'currency_code': re.compile(r'^[A-Z]{3}$'),
            'country_code': re.compile(r'^[A-Z]{2}$'),
            'postal_code_us': re.compile(r'^[0-9]{5}(-[0-9]{4})?$'),
            'postal_code_ca': re.compile(r'^[A-Z][0-9][A-Z] [0-9][A-Z][0-9]$'),
            'postal_code_uk': re.compile(r'^[A-Z]{1,2}[0-9R][0-9A-Z]? [0-9][A-Z]{2}$')
        }
        
        # Dangerous patterns to detect
        self.dangerous_patterns = [
            re.compile(r'<script[^>]*>.*?</script>', re.IGNORECASE | re.DOTALL),
            re.compile(r'javascript:', re.IGNORECASE),
            re.compile(r'on\w+\s*=', re.IGNORECASE),
            re.compile(r'<iframe[^>]*>.*?</iframe>', re.IGNORECASE | re.DOTALL),
            re.compile(r'<object[^>]*>.*?</object>', re.IGNORECASE | re.DOTALL),
            re.compile(r'<embed[^>]*>', re.IGNORECASE),
            re.compile(r'<link[^>]*>', re.IGNORECASE),
            re.compile(r'<meta[^>]*>', re.IGNORECASE),
            re.compile(r'<style[^>]*>.*?</style>', re.IGNORECASE | re.DOTALL),
            re.compile(r'expression\s*\(', re.IGNORECASE),
            re.compile(r'url\s*\(', re.IGNORECASE),
            re.compile(r'@import', re.IGNORECASE),
            re.compile(r'vbscript:', re.IGNORECASE),
            re.compile(r'data:', re.IGNORECASE)
        ]
        
        # SQL injection patterns
        self.sql_patterns = [
            re.compile(r'(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)', re.IGNORECASE),
            re.compile(r'(\b(OR|AND)\s+\d+\s*=\s*\d+)', re.IGNORECASE),
            re.compile(r'(\b(OR|AND)\s+[\'"]?\w+[\'"]?\s*=\s*[\'"]?\w+[\'"]?)', re.IGNORECASE),
            re.compile(r'(--|#|/\*|\*/)', re.IGNORECASE),
            re.compile(r'(\bUNION\b.*\bSELECT\b)', re.IGNORECASE),
            re.compile(r'(\b(EXEC|EXECUTE)\b)', re.IGNORECASE)
        ]
    
    def sanitize_string(self, value: str, max_length: int = None, allow_html: bool = False) -> str:
        """Sanitize string input"""
        if not isinstance(value, str):
            raise ValidationError("Value must be a string", code="INVALID_TYPE")
        
        # Remove null bytes
        value = value.replace('\x00', '')
        
        # Trim whitespace
        value = value.strip()
        
        # Check length
        if max_length and len(value) > max_length:
            raise ValidationError(f"String too long (max {max_length} characters)", code="STRING_TOO_LONG")
        
        # HTML escape if not allowing HTML
        if not allow_html:
            value = html.escape(value)
        
        # Check for dangerous patterns
        if not allow_html:
            for pattern in self.dangerous_patterns:
                if pattern.search(value):
                    raise ValidationError("Potentially dangerous content detected", code="DANGEROUS_CONTENT")
        
        # Check for SQL injection patterns
        for pattern in self.sql_patterns:
            if pattern.search(value):
                raise ValidationError("Potentially malicious SQL content detected", code="SQL_INJECTION")
        
        return value
    
    def validate_email(self, email: str) -> str:
        """Validate and normalize email address"""
        if not email:
            raise ValidationError("Email is required", field="email", code="EMAIL_REQUIRED")
        
        email = email.strip().lower()
        
        try:
            # Use email-validator library for comprehensive validation
            valid = validate_email(email)
            return valid.email
        except EmailNotValidError as e:
            raise ValidationError(f"Invalid email format: {str(e)}", field="email", code="INVALID_EMAIL")
    
    def validate_phone(self, phone: str, country_code: str = None) -> str:
        """Validate and format phone number"""
        if not phone:
            raise ValidationError("Phone number is required", field="phone", code="PHONE_REQUIRED")
        
        try:
            # Parse phone number
            parsed_number = phonenumbers.parse(phone, country_code)
            
            # Validate number
            if not phonenumbers.is_valid_number(parsed_number):
                raise ValidationError("Invalid phone number", field="phone", code="INVALID_PHONE")
            
            # Format in international format
            return phonenumbers.format_number(parsed_number, phonenumbers.PhoneNumberFormat.E164)
        except NumberParseException as e:
            raise ValidationError(f"Invalid phone number format: {str(e)}", field="phone", code="INVALID_PHONE_FORMAT")
    
    def validate_uuid(self, uuid_str: str) -> str:
        """Validate UUID format"""
        if not uuid_str:
            raise ValidationError("UUID is required", code="UUID_REQUIRED")
        
        uuid_str = uuid_str.strip().lower()
        
        if not self.patterns['uuid'].match(uuid_str):
            raise ValidationError("Invalid UUID format", code="INVALID_UUID")
        
        return uuid_str
    
    def validate_card_number(self, card_number: str) -> str:
        """Validate credit card number"""
        if not card_number:
            raise ValidationError("Card number is required", field="card_number", code="CARD_NUMBER_REQUIRED")
        
        # Remove spaces and dashes
        card_number = re.sub(r'[\s-]', '', card_number)
        
        # Check format
        if not self.patterns['card_number'].match(card_number):
            raise ValidationError("Invalid card number format", field="card_number", code="INVALID_CARD_NUMBER")
        
        # Validate using Luhn algorithm
        if not self._validate_luhn(card_number):
            raise ValidationError("Invalid card number (failed Luhn check)", field="card_number", code="INVALID_CARD_LUHN")
        
        return card_number
    
    def _validate_luhn(self, card_number: str) -> bool:
        """Validate card number using Luhn algorithm"""
        digits = [int(d) for d in card_number]
        
        # Double every second digit from right
        for i in range(len(digits) - 2, -1, -2):
            digits[i] *= 2
            if digits[i] > 9:
                digits[i] -= 9
        
        return sum(digits) % 10 == 0
    
    def validate_cvv(self, cvv: str) -> str:
        """Validate CVV"""
        if not cvv:
            raise ValidationError("CVV is required", field="cvv", code="CVV_REQUIRED")
        
        cvv = cvv.strip()
        
        if not self.patterns['cvv'].match(cvv):
            raise ValidationError("Invalid CVV format", field="cvv", code="INVALID_CVV")
        
        return cvv
    
    def validate_pin(self, pin: str) -> str:
        """Validate PIN"""
        if not pin:
            raise ValidationError("PIN is required", field="pin", code="PIN_REQUIRED")
        
        pin = pin.strip()
        
        if not self.patterns['pin'].match(pin):
            raise ValidationError("PIN must be exactly 4 digits", field="pin", code="INVALID_PIN")
        
        # Check for weak PINs
        if self._is_weak_pin(pin):
            raise ValidationError("PIN is too weak", field="pin", code="WEAK_PIN")
        
        return pin
    
    def _is_weak_pin(self, pin: str) -> bool:
        """Check if PIN is weak"""
        weak_pins = [
            '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',
            '1234', '4321', '1122', '2211', '1212', '2121', '0123', '3210'
        ]
        return pin in weak_pins
    
    def validate_amount(self, amount: Union[str, int, float, Decimal], min_amount: Decimal = None, 
                       max_amount: Decimal = None, currency: str = "USD") -> Decimal:
        """Validate monetary amount"""
        if amount is None:
            raise ValidationError("Amount is required", field="amount", code="AMOUNT_REQUIRED")
        
        try:
            # Convert to Decimal for precise monetary calculations
            if isinstance(amount, str):
                amount = amount.strip()
                # Remove currency symbols
                amount = re.sub(r'[^\d.-]', '', amount)
            
            decimal_amount = Decimal(str(amount))
        except (InvalidOperation, ValueError):
            raise ValidationError("Invalid amount format", field="amount", code="INVALID_AMOUNT")
        
        # Check for negative amounts
        if decimal_amount < 0:
            raise ValidationError("Amount cannot be negative", field="amount", code="NEGATIVE_AMOUNT")
        
        # Check precision (max 2 decimal places for most currencies)
        if decimal_amount.as_tuple().exponent < -2:
            raise ValidationError("Amount has too many decimal places", field="amount", code="INVALID_PRECISION")
        
        # Check minimum amount
        if min_amount is not None and decimal_amount < min_amount:
            raise ValidationError(f"Amount must be at least {min_amount}", field="amount", code="AMOUNT_TOO_LOW")
        
        # Check maximum amount
        if max_amount is not None and decimal_amount > max_amount:
            raise ValidationError(f"Amount cannot exceed {max_amount}", field="amount", code="AMOUNT_TOO_HIGH")
        
        return decimal_amount
    
    def validate_currency_code(self, currency: str) -> str:
        """Validate ISO 4217 currency code"""
        if not currency:
            raise ValidationError("Currency code is required", field="currency", code="CURRENCY_REQUIRED")
        
        currency = currency.strip().upper()
        
        if not self.patterns['currency_code'].match(currency):
            raise ValidationError("Invalid currency code format", field="currency", code="INVALID_CURRENCY")
        
        # List of common currency codes
        valid_currencies = {
            'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD',
            'MXN', 'SGD', 'HKD', 'NOK', 'TRY', 'ZAR', 'BRL', 'INR', 'KRW', 'PLN'
        }
        
        if currency not in valid_currencies:
            raise ValidationError(f"Unsupported currency code: {currency}", field="currency", code="UNSUPPORTED_CURRENCY")
        
        return currency
    
    def validate_country_code(self, country: str) -> str:
        """Validate ISO 3166-1 alpha-2 country code"""
        if not country:
            raise ValidationError("Country code is required", field="country", code="COUNTRY_REQUIRED")
        
        country = country.strip().upper()
        
        if not self.patterns['country_code'].match(country):
            raise ValidationError("Invalid country code format", field="country", code="INVALID_COUNTRY")
        
        # List of common country codes
        valid_countries = {
            'US', 'CA', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK',
            'FI', 'IE', 'PT', 'GR', 'PL', 'CZ', 'HU', 'SK', 'SI', 'EE', 'LV', 'LT', 'LU', 'MT',
            'CY', 'BG', 'RO', 'HR', 'AU', 'NZ', 'JP', 'KR', 'SG', 'HK', 'IN', 'CN', 'BR', 'MX',
            'AR', 'CL', 'CO', 'PE', 'ZA', 'NG', 'EG', 'MA', 'KE', 'GH', 'TN', 'AE', 'SA', 'IL',
            'TR', 'RU', 'UA', 'BY', 'KZ', 'UZ', 'TH', 'VN', 'MY', 'ID', 'PH', 'TW', 'BD', 'PK'
        }
        
        if country not in valid_countries:
            raise ValidationError(f"Unsupported country code: {country}", field="country", code="UNSUPPORTED_COUNTRY")
        
        return country
    
    def validate_date(self, date_str: str, date_format: str = "%Y-%m-%d") -> date:
        """Validate date string"""
        if not date_str:
            raise ValidationError("Date is required", field="date", code="DATE_REQUIRED")
        
        try:
            parsed_date = datetime.strptime(date_str.strip(), date_format).date()
            return parsed_date
        except ValueError as e:
            raise ValidationError(f"Invalid date format: {str(e)}", field="date", code="INVALID_DATE")
    
    def validate_datetime(self, datetime_str: str, datetime_format: str = "%Y-%m-%d %H:%M:%S") -> datetime:
        """Validate datetime string"""
        if not datetime_str:
            raise ValidationError("Datetime is required", field="datetime", code="DATETIME_REQUIRED")
        
        try:
            parsed_datetime = datetime.strptime(datetime_str.strip(), datetime_format)
            return parsed_datetime
        except ValueError as e:
            raise ValidationError(f"Invalid datetime format: {str(e)}", field="datetime", code="INVALID_DATETIME")
    
    def validate_ip_address(self, ip: str) -> str:
        """Validate IP address"""
        if not ip:
            raise ValidationError("IP address is required", field="ip", code="IP_REQUIRED")
        
        ip = ip.strip()
        
        try:
            # Validate using ipaddress module
            ip_obj = ipaddress.ip_address(ip)
            return str(ip_obj)
        except ValueError:
            raise ValidationError("Invalid IP address format", field="ip", code="INVALID_IP")
    
    def validate_url(self, url: str, allowed_schemes: List[str] = None) -> str:
        """Validate URL"""
        if not url:
            raise ValidationError("URL is required", field="url", code="URL_REQUIRED")
        
        url = url.strip()
        
        if not self.patterns['url'].match(url):
            raise ValidationError("Invalid URL format", field="url", code="INVALID_URL")
        
        # Check allowed schemes
        if allowed_schemes:
            scheme = url.split('://')[0].lower()
            if scheme not in allowed_schemes:
                raise ValidationError(f"URL scheme not allowed: {scheme}", field="url", code="INVALID_URL_SCHEME")
        
        return url
    
    def validate_json(self, json_str: str) -> dict:
        """Validate JSON string"""
        if not json_str:
            raise ValidationError("JSON is required", field="json", code="JSON_REQUIRED")
        
        try:
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            raise ValidationError(f"Invalid JSON format: {str(e)}", field="json", code="INVALID_JSON")
    
    def validate_base64(self, base64_str: str) -> str:
        """Validate base64 string"""
        if not base64_str:
            raise ValidationError("Base64 string is required", field="base64", code="BASE64_REQUIRED")
        
        base64_str = base64_str.strip()
        
        if not self.patterns['base64'].match(base64_str):
            raise ValidationError("Invalid base64 format", field="base64", code="INVALID_BASE64")
        
        try:
            import base64
            base64.b64decode(base64_str, validate=True)
            return base64_str
        except Exception:
            raise ValidationError("Invalid base64 encoding", field="base64", code="INVALID_BASE64_ENCODING")
    
    def validate_activation_code(self, code: str) -> bool:
        """Validate activation code format"""
        if not code:
            return False
        
        code = code.strip().upper()
        
        # Activation codes should be 8-12 alphanumeric characters
        if len(code) < 8 or len(code) > 12:
            return False
        
        return self.patterns['alphanumeric'].match(code) is not None
    
    def validate_routing_number(self, routing_number: str) -> str:
        """Validate US bank routing number"""
        if not routing_number:
            raise ValidationError("Routing number is required", field="routing_number", code="ROUTING_NUMBER_REQUIRED")
        
        routing_number = routing_number.strip()
        
        if not self.patterns['routing_number'].match(routing_number):
            raise ValidationError("Invalid routing number format", field="routing_number", code="INVALID_ROUTING_NUMBER")
        
        # Validate routing number checksum
        if not self._validate_routing_checksum(routing_number):
            raise ValidationError("Invalid routing number checksum", field="routing_number", code="INVALID_ROUTING_CHECKSUM")
        
        return routing_number
    
    def _validate_routing_checksum(self, routing_number: str) -> bool:
        """Validate routing number checksum"""
        weights = [3, 7, 1, 3, 7, 1, 3, 7, 1]
        total = sum(int(digit) * weight for digit, weight in zip(routing_number, weights))
        return total % 10 == 0
    
    def validate_swift_code(self, swift_code: str) -> str:
        """Validate SWIFT/BIC code"""
        if not swift_code:
            raise ValidationError("SWIFT code is required", field="swift_code", code="SWIFT_CODE_REQUIRED")
        
        swift_code = swift_code.strip().upper()
        
        if not self.patterns['swift_code'].match(swift_code):
            raise ValidationError("Invalid SWIFT code format", field="swift_code", code="INVALID_SWIFT_CODE")
        
        return swift_code
    
    def validate_iban(self, iban: str) -> str:
        """Validate IBAN"""
        if not iban:
            raise ValidationError("IBAN is required", field="iban", code="IBAN_REQUIRED")
        
        iban = iban.strip().upper().replace(' ', '')
        
        if not self.patterns['iban'].match(iban):
            raise ValidationError("Invalid IBAN format", field="iban", code="INVALID_IBAN")
        
        # Validate IBAN checksum
        if not self._validate_iban_checksum(iban):
            raise ValidationError("Invalid IBAN checksum", field="iban", code="INVALID_IBAN_CHECKSUM")
        
        return iban
    
    def _validate_iban_checksum(self, iban: str) -> bool:
        """Validate IBAN checksum using mod-97 algorithm"""
        # Move first 4 characters to end
        rearranged = iban[4:] + iban[:4]
        
        # Replace letters with numbers (A=10, B=11, ..., Z=35)
        numeric_string = ''
        for char in rearranged:
            if char.isalpha():
                numeric_string += str(ord(char) - ord('A') + 10)
            else:
                numeric_string += char
        
        # Calculate mod 97
        return int(numeric_string) % 97 == 1
    
    def sanitize_filename(self, filename: str) -> str:
        """Sanitize filename for safe storage"""
        if not filename:
            raise ValidationError("Filename is required", field="filename", code="FILENAME_REQUIRED")
        
        # Remove path separators and dangerous characters
        filename = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '', filename)
        
        # Remove leading/trailing dots and spaces
        filename = filename.strip('. ')
        
        # Limit length
        if len(filename) > 255:
            name, ext = os.path.splitext(filename)
            filename = name[:255-len(ext)] + ext
        
        if not filename:
            raise ValidationError("Invalid filename", field="filename", code="INVALID_FILENAME")
        
        return filename
    
    def validate_password_complexity(self, password: str) -> Dict[str, Any]:
        """Validate password complexity"""
        if not password:
            raise ValidationError("Password is required", field="password", code="PASSWORD_REQUIRED")
        
        errors = []
        score = 0
        
        # Length check
        if len(password) < 8:
            errors.append("Password must be at least 8 characters long")
        elif len(password) >= 12:
            score += 2
        else:
            score += 1
        
        # Character variety checks
        if re.search(r'[a-z]', password):
            score += 1
        else:
            errors.append("Password must contain at least one lowercase letter")
        
        if re.search(r'[A-Z]', password):
            score += 1
        else:
            errors.append("Password must contain at least one uppercase letter")
        
        if re.search(r'[0-9]', password):
            score += 1
        else:
            errors.append("Password must contain at least one digit")
        
        if re.search(r'[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]', password):
            score += 2
        else:
            errors.append("Password must contain at least one special character")
        
        # Common password check
        common_passwords = ['password', '123456', 'qwerty', 'abc123', 'password123']
        if password.lower() in common_passwords:
            errors.append("Password is too common")
            score = 0
        
        # Calculate strength
        if score >= 6:
            strength = "strong"
        elif score >= 4:
            strength = "medium"
        else:
            strength = "weak"
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'strength': strength,
            'score': score
        }

# Global validator instance
input_validator = InputValidator()


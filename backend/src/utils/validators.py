"""
Enhanced input validation for financial applications
"""

import re
import phonenumbers
from email_validator import validate_email, EmailNotValidError
from decimal import Decimal, InvalidOperation
from datetime import datetime, date
import bleach
from typing import Any, Dict, List, Optional, Union

class InputValidator:
    """Comprehensive input validation for financial applications"""
    
    # Common regex patterns
    PATTERNS = {
        'username': r'^[a-zA-Z0-9_]{3,30}$',
        'password': r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$',
        'account_number': r'^\d{10,20}$',
        'routing_number': r'^\d{9}$',
        'card_number': r'^\d{13,19}$',
        'cvv': r'^\d{3,4}$',
        'pin': r'^\d{4}$',
        'currency_code': r'^[A-Z]{3}$',
        'country_code': r'^[A-Z]{2}$',
        'postal_code': r'^[A-Z0-9\s\-]{3,10}$',
        'transaction_id': r'^[A-Z0-9\-]{10,50}$'
    }
    
    # Allowed HTML tags for sanitization
    ALLOWED_TAGS = ['b', 'i', 'u', 'em', 'strong', 'p', 'br']
    ALLOWED_ATTRIBUTES = {}
    
    @staticmethod
    def validate_email(email: str) -> tuple[bool, str]:
        """Validate email address"""
        if not email:
            return False, "Email is required"
        
        try:
            # Validate and get normalized result
            valid = validate_email(email)
            return True, valid.email
        except EmailNotValidError as e:
            return False, str(e)
    
    @staticmethod
    def validate_password(password: str) -> tuple[bool, str]:
        """Validate password strength"""
        if not password:
            return False, "Password is required"
        
        if len(password) < 12:
            return False, "Password must be at least 12 characters long"
        
        if not re.search(r'[a-z]', password):
            return False, "Password must contain at least one lowercase letter"
        
        if not re.search(r'[A-Z]', password):
            return False, "Password must contain at least one uppercase letter"
        
        if not re.search(r'\d', password):
            return False, "Password must contain at least one digit"
        
        if not re.search(r'[@$!%*?&]', password):
            return False, "Password must contain at least one special character (@$!%*?&)"
        
        # Check for common weak passwords
        weak_passwords = [
            'password123!', 'admin123!@#', 'qwerty123!', 'welcome123!',
            '123456789!', 'password!@#', 'admin!@#$'
        ]
        
        if password.lower() in [p.lower() for p in weak_passwords]:
            return False, "Password is too common. Please choose a stronger password"
        
        return True, "Password is valid"
    
    @staticmethod
    def validate_phone_number(phone: str, country_code: str = 'US') -> tuple[bool, str]:
        """Validate phone number"""
        if not phone:
            return False, "Phone number is required"
        
        try:
            parsed_number = phonenumbers.parse(phone, country_code)
            if phonenumbers.is_valid_number(parsed_number):
                formatted_number = phonenumbers.format_number(
                    parsed_number, phonenumbers.PhoneNumberFormat.E164
                )
                return True, formatted_number
            else:
                return False, "Invalid phone number"
        except phonenumbers.NumberParseException:
            return False, "Invalid phone number format"
    
    @staticmethod
    def validate_amount(amount: Union[str, float, Decimal], min_amount: Decimal = Decimal('0.01'), 
                       max_amount: Decimal = Decimal('1000000.00')) -> tuple[bool, str, Optional[Decimal]]:
        """Validate monetary amount"""
        if amount is None:
            return False, "Amount is required", None
        
        try:
            # Convert to Decimal for precise financial calculations
            if isinstance(amount, str):
                # Remove currency symbols and whitespace
                cleaned_amount = re.sub(r'[^\d.-]', '', amount)
                decimal_amount = Decimal(cleaned_amount)
            elif isinstance(amount, (int, float)):
                decimal_amount = Decimal(str(amount))
            elif isinstance(amount, Decimal):
                decimal_amount = amount
            else:
                return False, "Invalid amount format", None
            
            # Check for negative amounts
            if decimal_amount < 0:
                return False, "Amount cannot be negative", None
            
            # Check minimum amount
            if decimal_amount < min_amount:
                return False, f"Amount must be at least {min_amount}", None
            
            # Check maximum amount
            if decimal_amount > max_amount:
                return False, f"Amount cannot exceed {max_amount}", None
            
            # Check decimal places (max 2 for most currencies)
            if decimal_amount.as_tuple().exponent < -2:
                return False, "Amount cannot have more than 2 decimal places", None
            
            return True, "Amount is valid", decimal_amount
            
        except (InvalidOperation, ValueError):
            return False, "Invalid amount format", None
    
    @staticmethod
    def validate_currency_code(currency: str) -> tuple[bool, str]:
        """Validate ISO 4217 currency code"""
        if not currency:
            return False, "Currency code is required"
        
        # List of supported currencies
        supported_currencies = [
            'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY',
            'SEK', 'NZD', 'MXN', 'SGD', 'HKD', 'NOK', 'TRY', 'ZAR',
            'BRL', 'INR', 'KRW', 'PLN'
        ]
        
        currency_upper = currency.upper()
        
        if not re.match(InputValidator.PATTERNS['currency_code'], currency_upper):
            return False, "Currency code must be 3 uppercase letters"
        
        if currency_upper not in supported_currencies:
            return False, f"Currency {currency_upper} is not supported"
        
        return True, currency_upper
    
    @staticmethod
    def validate_date(date_str: str, date_format: str = '%Y-%m-%d') -> tuple[bool, str, Optional[date]]:
        """Validate date string"""
        if not date_str:
            return False, "Date is required", None
        
        try:
            parsed_date = datetime.strptime(date_str, date_format).date()
            
            # Check if date is not in the future (for birth dates, etc.)
            if parsed_date > date.today():
                return False, "Date cannot be in the future", None
            
            # Check if date is not too far in the past (reasonable birth date)
            min_date = date(1900, 1, 1)
            if parsed_date < min_date:
                return False, "Date is too far in the past", None
            
            return True, "Date is valid", parsed_date
            
        except ValueError:
            return False, f"Invalid date format. Expected format: {date_format}", None
    
    @staticmethod
    def validate_card_number(card_number: str) -> tuple[bool, str]:
        """Validate credit card number using Luhn algorithm"""
        if not card_number:
            return False, "Card number is required"
        
        # Remove spaces and hyphens
        cleaned_number = re.sub(r'[\s-]', '', card_number)
        
        # Check format
        if not re.match(InputValidator.PATTERNS['card_number'], cleaned_number):
            return False, "Invalid card number format"
        
        # Luhn algorithm validation
        def luhn_checksum(card_num):
            def digits_of(n):
                return [int(d) for d in str(n)]
            digits = digits_of(card_num)
            odd_digits = digits[-1::-2]
            even_digits = digits[-2::-2]
            checksum = sum(odd_digits)
            for d in even_digits:
                checksum += sum(digits_of(d*2))
            return checksum % 10
        
        if luhn_checksum(cleaned_number) != 0:
            return False, "Invalid card number"
        
        return True, cleaned_number
    
    @staticmethod
    def sanitize_html(text: str) -> str:
        """Sanitize HTML input to prevent XSS attacks"""
        if not text:
            return ""
        
        return bleach.clean(
            text,
            tags=InputValidator.ALLOWED_TAGS,
            attributes=InputValidator.ALLOWED_ATTRIBUTES,
            strip=True
        )
    
    @staticmethod
    def validate_json_structure(data: Dict[str, Any], required_fields: List[str], 
                              optional_fields: List[str] = None) -> tuple[bool, str]:
        """Validate JSON structure"""
        if not isinstance(data, dict):
            return False, "Data must be a JSON object"
        
        # Check required fields
        missing_fields = []
        for field in required_fields:
            if field not in data:
                missing_fields.append(field)
        
        if missing_fields:
            return False, f"Missing required fields: {', '.join(missing_fields)}"
        
        # Check for unexpected fields
        allowed_fields = set(required_fields)
        if optional_fields:
            allowed_fields.update(optional_fields)
        
        unexpected_fields = []
        for field in data.keys():
            if field not in allowed_fields:
                unexpected_fields.append(field)
        
        if unexpected_fields:
            return False, f"Unexpected fields: {', '.join(unexpected_fields)}"
        
        return True, "JSON structure is valid"
    
    @staticmethod
    def validate_account_number(account_number: str) -> tuple[bool, str]:
        """Validate bank account number"""
        if not account_number:
            return False, "Account number is required"
        
        # Remove spaces and hyphens
        cleaned_number = re.sub(r'[\s-]', '', account_number)
        
        if not re.match(InputValidator.PATTERNS['account_number'], cleaned_number):
            return False, "Account number must be 10-20 digits"
        
        return True, cleaned_number
    
    @staticmethod
    def validate_routing_number(routing_number: str) -> tuple[bool, str]:
        """Validate bank routing number"""
        if not routing_number:
            return False, "Routing number is required"
        
        # Remove spaces and hyphens
        cleaned_number = re.sub(r'[\s-]', '', routing_number)
        
        if not re.match(InputValidator.PATTERNS['routing_number'], cleaned_number):
            return False, "Routing number must be exactly 9 digits"
        
        # Validate routing number checksum
        def validate_routing_checksum(routing):
            weights = [3, 7, 1, 3, 7, 1, 3, 7, 1]
            checksum = sum(int(digit) * weight for digit, weight in zip(routing, weights))
            return checksum % 10 == 0
        
        if not validate_routing_checksum(cleaned_number):
            return False, "Invalid routing number"
        
        return True, cleaned_number
    
    @staticmethod
    def validate_address(address_data: Dict[str, str]) -> tuple[bool, str]:
        """Validate address information"""
        required_fields = ['line1', 'city', 'country']
        
        for field in required_fields:
            if not address_data.get(field):
                return False, f"{field} is required"
        
        # Validate country code
        country = address_data.get('country', '').upper()
        if not re.match(InputValidator.PATTERNS['country_code'], country):
            return False, "Invalid country code"
        
        # Validate postal code if provided
        postal_code = address_data.get('postal_code')
        if postal_code and not re.match(InputValidator.PATTERNS['postal_code'], postal_code.upper()):
            return False, "Invalid postal code format"
        
        return True, "Address is valid"
    
    @staticmethod
    def validate_transaction_data(transaction_data: Dict[str, Any]) -> tuple[bool, str]:
        """Validate transaction data"""
        required_fields = ['amount', 'currency', 'description', 'account_id']
        
        is_valid, message = InputValidator.validate_json_structure(
            transaction_data, required_fields
        )
        
        if not is_valid:
            return False, message
        
        # Validate amount
        is_valid, message, _ = InputValidator.validate_amount(transaction_data['amount'])
        if not is_valid:
            return False, f"Amount validation failed: {message}"
        
        # Validate currency
        is_valid, _ = InputValidator.validate_currency_code(transaction_data['currency'])
        if not is_valid:
            return False, "Invalid currency code"
        
        # Validate description
        description = transaction_data.get('description', '').strip()
        if len(description) < 3:
            return False, "Description must be at least 3 characters"
        
        if len(description) > 500:
            return False, "Description cannot exceed 500 characters"
        
        return True, "Transaction data is valid"


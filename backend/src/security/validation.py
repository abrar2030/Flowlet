# Enhanced Input Validation and Sanitization
# Financial Industry Standards Compliant

import re
import decimal
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, List, Optional, Union
import logging
from datetime import datetime, date
import phonenumbers
from phonenumbers import NumberParseException
import email_validator
from email_validator import validate_email, EmailNotValidError

logger = logging.getLogger(__name__)

class ValidationError(Exception):
    """Custom exception for validation errors"""
    pass

class InputValidator:
    """
    Enhanced Input Validator implementing financial industry standards
    Provides comprehensive validation for financial data types
    """
    
    # Supported currencies (ISO 4217)
    SUPPORTED_CURRENCIES = [
        'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY',
        'SEK', 'NZD', 'MXN', 'SGD', 'HKD', 'NOK', 'TRY', 'ZAR',
        'BRL', 'INR', 'KRW', 'PLN'
    ]
    
    # Supported wallet types
    SUPPORTED_WALLET_TYPES = ['user', 'business', 'escrow', 'operating']
    
    # Supported payment methods
    SUPPORTED_PAYMENT_METHODS = [
        'card', 'ach', 'wire', 'sepa', 'wallet', 'bank_transfer', 'digital_wallet'
    ]
    
    # Supported transaction types
    SUPPORTED_TRANSACTION_TYPES = ['credit', 'debit', 'transfer']
    
    # Supported KYC verification levels
    SUPPORTED_KYC_LEVELS = ['basic', 'enhanced', 'premium']
    
    # Supported document types
    SUPPORTED_DOCUMENT_TYPES = ['passport', 'drivers_license', 'national_id', 'utility_bill']
    
    # Regular expressions for validation
    PATTERNS = {
        'card_number': re.compile(r'^\d{13,19}$'),
        'cvv': re.compile(r'^\d{3,4}$'),
        'routing_number': re.compile(r'^\d{9}$'),
        'account_number': re.compile(r'^\d{4,17}$'),
        'iban': re.compile(r'^[A-Z]{2}\d{2}[A-Z0-9]{4,30}$'),
        'swift_code': re.compile(r'^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$'),
        'ssn': re.compile(r'^\d{3}-?\d{2}-?\d{4}$'),
        'ein': re.compile(r'^\d{2}-?\d{7}$'),
        'uuid': re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'),
        'alphanumeric': re.compile(r'^[a-zA-Z0-9]+$'),
        'name': re.compile(r'^[a-zA-Z\s\-\'\.]+$'),
        'address': re.compile(r'^[a-zA-Z0-9\s\-\#\,\.]+$')
    }
    
    @staticmethod
    def validate_currency(currency: str) -> bool:
        """
        Validate ISO 4217 currency code
        
        Args:
            currency: Currency code to validate
            
        Returns:
            True if valid, False otherwise
        """
        if not isinstance(currency, str):
            return False
        
        return currency.upper() in InputValidator.SUPPORTED_CURRENCIES
    
    @staticmethod
    def validate_amount(amount: Union[str, int, float, Decimal]) -> bool:
        """
        Validate monetary amount
        
        Args:
            amount: Amount to validate
            
        Returns:
            True if valid, False otherwise
        """
        try:
            if isinstance(amount, str):
                # Remove common formatting characters
                cleaned_amount = amount.replace(',', '').replace('$', '').strip()
                decimal_amount = Decimal(cleaned_amount)
            elif isinstance(amount, (int, float)):
                decimal_amount = Decimal(str(amount))
            elif isinstance(amount, Decimal):
                decimal_amount = amount
            else:
                return False
            
            # Check for reasonable bounds (0 to 1 billion)
            if decimal_amount < 0 or decimal_amount > Decimal('1000000000'):
                return False
            
            # Check decimal places (max 2 for most currencies)
            if decimal_amount.as_tuple().exponent < -2:
                return False
            
            return True
            
        except (InvalidOperation, ValueError, TypeError):
            return False
    
    @staticmethod
    def validate_wallet_type(wallet_type: str) -> bool:
        """
        Validate wallet type
        
        Args:
            wallet_type: Wallet type to validate
            
        Returns:
            True if valid, False otherwise
        """
        if not isinstance(wallet_type, str):
            return False
        
        return wallet_type.lower() in InputValidator.SUPPORTED_WALLET_TYPES
    
    @staticmethod
    def validate_payment_method(payment_method: str) -> bool:
        """
        Validate payment method
        
        Args:
            payment_method: Payment method to validate
            
        Returns:
            True if valid, False otherwise
        """
        if not isinstance(payment_method, str):
            return False
        
        return payment_method.lower() in InputValidator.SUPPORTED_PAYMENT_METHODS
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """
        Validate email address
        
        Args:
            email: Email address to validate
            
        Returns:
            True if valid, False otherwise
        """
        try:
            if not isinstance(email, str):
                return False
            
            # Use email-validator library for comprehensive validation
            validate_email(email)
            return True
            
        except EmailNotValidError:
            return False
        except Exception:
            return False
    
    @staticmethod
    def validate_phone_number(phone: str, country_code: str = 'US') -> bool:
        """
        Validate phone number
        
        Args:
            phone: Phone number to validate
            country_code: Country code for validation
            
        Returns:
            True if valid, False otherwise
        """
        try:
            if not isinstance(phone, str):
                return False
            
            # Parse and validate phone number
            parsed_number = phonenumbers.parse(phone, country_code)
            return phonenumbers.is_valid_number(parsed_number)
            
        except NumberParseException:
            return False
        except Exception:
            return False
    
    @staticmethod
    def validate_card_number(card_number: str) -> bool:
        """
        Validate credit card number using Luhn algorithm
        
        Args:
            card_number: Card number to validate
            
        Returns:
            True if valid, False otherwise
        """
        try:
            if not isinstance(card_number, str):
                return False
            
            # Remove spaces and hyphens
            cleaned_number = re.sub(r'[\s\-]', '', card_number)
            
            # Check format
            if not InputValidator.PATTERNS['card_number'].match(cleaned_number):
                return False
            
            # Luhn algorithm validation
            def luhn_checksum(card_num):
                def digits_of(n):
                    return [int(d) for d in str(n)]
                
                digits = digits_of(card_num)
                odd_digits = digits[-1::-2]
                even_digits = digits[-2::-2]
                checksum = sum(odd_digits)
                for d in even_digits:
                    checksum += sum(digits_of(d * 2))
                return checksum % 10
            
            return luhn_checksum(cleaned_number) == 0
            
        except Exception:
            return False
    
    @staticmethod
    def validate_cvv(cvv: str) -> bool:
        """
        Validate CVV code
        
        Args:
            cvv: CVV code to validate
            
        Returns:
            True if valid, False otherwise
        """
        if not isinstance(cvv, str):
            return False
        
        return InputValidator.PATTERNS['cvv'].match(cvv) is not None
    
    @staticmethod
    def validate_routing_number(routing_number: str) -> bool:
        """
        Validate US bank routing number
        
        Args:
            routing_number: Routing number to validate
            
        Returns:
            True if valid, False otherwise
        """
        try:
            if not isinstance(routing_number, str):
                return False
            
            # Remove spaces and hyphens
            cleaned_number = re.sub(r'[\s\-]', '', routing_number)
            
            # Check format
            if not InputValidator.PATTERNS['routing_number'].match(cleaned_number):
                return False
            
            # ABA routing number checksum validation
            digits = [int(d) for d in cleaned_number]
            checksum = (
                3 * (digits[0] + digits[3] + digits[6]) +
                7 * (digits[1] + digits[4] + digits[7]) +
                1 * (digits[2] + digits[5] + digits[8])
            )
            
            return checksum % 10 == 0
            
        except Exception:
            return False
    
    @staticmethod
    def validate_iban(iban: str) -> bool:
        """
        Validate International Bank Account Number (IBAN)
        
        Args:
            iban: IBAN to validate
            
        Returns:
            True if valid, False otherwise
        """
        try:
            if not isinstance(iban, str):
                return False
            
            # Remove spaces and convert to uppercase
            cleaned_iban = re.sub(r'\s', '', iban.upper())
            
            # Check format
            if not InputValidator.PATTERNS['iban'].match(cleaned_iban):
                return False
            
            # IBAN checksum validation (mod-97)
            # Move first 4 characters to end
            rearranged = cleaned_iban[4:] + cleaned_iban[:4]
            
            # Replace letters with numbers (A=10, B=11, ..., Z=35)
            numeric_string = ''
            for char in rearranged:
                if char.isalpha():
                    numeric_string += str(ord(char) - ord('A') + 10)
                else:
                    numeric_string += char
            
            # Check mod 97
            return int(numeric_string) % 97 == 1
            
        except Exception:
            return False
    
    @staticmethod
    def validate_swift_code(swift_code: str) -> bool:
        """
        Validate SWIFT/BIC code
        
        Args:
            swift_code: SWIFT code to validate
            
        Returns:
            True if valid, False otherwise
        """
        if not isinstance(swift_code, str):
            return False
        
        return InputValidator.PATTERNS['swift_code'].match(swift_code.upper()) is not None
    
    @staticmethod
    def validate_ssn(ssn: str) -> bool:
        """
        Validate US Social Security Number
        
        Args:
            ssn: SSN to validate
            
        Returns:
            True if valid, False otherwise
        """
        if not isinstance(ssn, str):
            return False
        
        # Remove hyphens
        cleaned_ssn = ssn.replace('-', '')
        
        # Check format
        if not re.match(r'^\d{9}$', cleaned_ssn):
            return False
        
        # Check for invalid patterns
        if (cleaned_ssn == '000000000' or
            cleaned_ssn[:3] == '000' or
            cleaned_ssn[3:5] == '00' or
            cleaned_ssn[5:] == '0000' or
            cleaned_ssn[:3] == '666' or
            cleaned_ssn[:3].startswith('9')):
            return False
        
        return True
    
    @staticmethod
    def validate_date(date_string: str, date_format: str = '%Y-%m-%d') -> bool:
        """
        Validate date string
        
        Args:
            date_string: Date string to validate
            date_format: Expected date format
            
        Returns:
            True if valid, False otherwise
        """
        try:
            if not isinstance(date_string, str):
                return False
            
            datetime.strptime(date_string, date_format)
            return True
            
        except ValueError:
            return False
    
    @staticmethod
    def validate_uuid(uuid_string: str) -> bool:
        """
        Validate UUID string
        
        Args:
            uuid_string: UUID string to validate
            
        Returns:
            True if valid, False otherwise
        """
        if not isinstance(uuid_string, str):
            return False
        
        return InputValidator.PATTERNS['uuid'].match(uuid_string.lower()) is not None
    
    @staticmethod
    def sanitize_string(input_string: str, max_length: int = 255, 
                       allowed_chars: str = None) -> str:
        """
        Sanitize string input
        
        Args:
            input_string: String to sanitize
            max_length: Maximum allowed length
            allowed_chars: Regex pattern for allowed characters
            
        Returns:
            Sanitized string
        """
        if not isinstance(input_string, str):
            return ''
        
        # Trim whitespace
        sanitized = input_string.strip()
        
        # Limit length
        if len(sanitized) > max_length:
            sanitized = sanitized[:max_length]
        
        # Filter allowed characters
        if allowed_chars:
            pattern = re.compile(allowed_chars)
            sanitized = ''.join(char for char in sanitized if pattern.match(char))
        
        return sanitized
    
    @staticmethod
    def validate_json_structure(data: Dict, required_fields: List[str], 
                              optional_fields: List[str] = None) -> Tuple[bool, List[str]]:
        """
        Validate JSON structure
        
        Args:
            data: JSON data to validate
            required_fields: List of required field names
            optional_fields: List of optional field names
            
        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        errors = []
        
        if not isinstance(data, dict):
            errors.append("Data must be a JSON object")
            return False, errors
        
        # Check required fields
        for field in required_fields:
            if field not in data:
                errors.append(f"Missing required field: {field}")
            elif data[field] is None:
                errors.append(f"Required field cannot be null: {field}")
        
        # Check for unexpected fields
        allowed_fields = set(required_fields + (optional_fields or []))
        for field in data.keys():
            if field not in allowed_fields:
                errors.append(f"Unexpected field: {field}")
        
        return len(errors) == 0, errors

# Convenience functions for common validations
def validate_currency(currency: str) -> bool:
    """Validate currency code"""
    return InputValidator.validate_currency(currency)

def validate_amount(amount: Union[str, int, float, Decimal]) -> bool:
    """Validate monetary amount"""
    return InputValidator.validate_amount(amount)

def validate_wallet_type(wallet_type: str) -> bool:
    """Validate wallet type"""
    return InputValidator.validate_wallet_type(wallet_type)

def validate_payment_method(payment_method: str) -> bool:
    """Validate payment method"""
    return InputValidator.validate_payment_method(payment_method)

def validate_email(email: str) -> bool:
    """Validate email address"""
    return InputValidator.validate_email(email)

def validate_phone_number(phone: str, country_code: str = 'US') -> bool:
    """Validate phone number"""
    return InputValidator.validate_phone_number(phone, country_code)

def validate_card_number(card_number: str) -> bool:
    """Validate credit card number"""
    return InputValidator.validate_card_number(card_number)

def sanitize_string(input_string: str, max_length: int = 255) -> str:
    """Sanitize string input"""
    return InputValidator.sanitize_string(input_string, max_length)


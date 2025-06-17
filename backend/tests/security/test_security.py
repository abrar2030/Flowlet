# Unit Tests for Security Features
import pytest
import json
from decimal import Decimal
from datetime import datetime, timedelta
from src.security.password_security import PasswordSecurity
from src.security.input_validator import InputValidator, ValidationError
from src.security.encryption_manager import EncryptionManager, TokenizationManager
from src.security.rate_limiter import RateLimiter

class TestPasswordSecurity:
    """Test password security functionality"""
    
    def test_password_hashing(self):
        """Test password hashing and verification"""
        password = "TestPassword123!"
        hashed = PasswordSecurity.hash_password(password)
        
        assert hashed != password
        assert PasswordSecurity.verify_password(password, hashed)
        assert not PasswordSecurity.verify_password("wrong_password", hashed)
    
    def test_password_strength_validation(self):
        """Test password strength validation"""
        # Strong password
        strong_password = "StrongP@ssw0rd123"
        is_valid, errors = PasswordSecurity.validate_password_strength(strong_password)
        assert is_valid
        assert len(errors) == 0
        
        # Weak password
        weak_password = "weak"
        is_valid, errors = PasswordSecurity.validate_password_strength(weak_password)
        assert not is_valid
        assert len(errors) > 0
    
    def test_password_generation(self):
        """Test secure password generation"""
        password = PasswordSecurity.generate_secure_password(16)
        
        assert len(password) == 16
        is_valid, errors = PasswordSecurity.validate_password_strength(password)
        assert is_valid
    
    def test_password_entropy_calculation(self):
        """Test password entropy calculation"""
        simple_password = "password"
        complex_password = "C0mpl3x!P@ssw0rd"
        
        simple_entropy = PasswordSecurity.calculate_password_entropy(simple_password)
        complex_entropy = PasswordSecurity.calculate_password_entropy(complex_password)
        
        assert complex_entropy > simple_entropy

class TestInputValidator:
    """Test input validation functionality"""
    
    def test_string_validation(self):
        """Test string validation"""
        # Valid string
        result = InputValidator.validate_string("test", "field", min_length=1, max_length=10)
        assert result == "test"
        
        # Invalid length
        with pytest.raises(ValidationError):
            InputValidator.validate_string("", "field", min_length=1)
        
        with pytest.raises(ValidationError):
            InputValidator.validate_string("too_long_string", "field", max_length=5)
    
    def test_email_validation(self):
        """Test email validation"""
        # Valid email
        result = InputValidator.validate_email("test@example.com", "email")
        assert result == "test@example.com"
        
        # Invalid email
        with pytest.raises(ValidationError):
            InputValidator.validate_email("invalid_email", "email")
    
    def test_decimal_validation(self):
        """Test decimal validation"""
        # Valid decimal
        result = InputValidator.validate_decimal("123.45", "amount")
        assert result == Decimal("123.45")
        
        # Invalid decimal
        with pytest.raises(ValidationError):
            InputValidator.validate_decimal("invalid", "amount")
        
        # Out of range
        with pytest.raises(ValidationError):
            InputValidator.validate_decimal("5.00", "amount", min_value=Decimal("10.00"))
    
    def test_card_number_validation(self):
        """Test credit card number validation"""
        # Valid card number (test number)
        valid_card = "4532015112830366"  # Valid Luhn
        result = InputValidator.validate_card_number(valid_card, "card_number")
        assert result == valid_card
        
        # Invalid card number
        with pytest.raises(ValidationError):
            InputValidator.validate_card_number("1234567890123456", "card_number")
    
    def test_currency_validation(self):
        """Test currency code validation"""
        # Valid currency
        result = InputValidator.validate_currency_code("USD", "currency")
        assert result == "USD"
        
        # Invalid currency
        with pytest.raises(ValidationError):
            InputValidator.validate_currency_code("INVALID", "currency")

class TestEncryptionManager:
    """Test encryption and tokenization functionality"""
    
    def test_field_encryption(self):
        """Test field encryption and decryption"""
        encryption_manager = EncryptionManager()
        
        original_data = "sensitive_information"
        encrypted_data = encryption_manager.encrypt_field(original_data, "test_field")
        decrypted_data = encryption_manager.decrypt_field(encrypted_data)
        
        assert encrypted_data != original_data
        assert decrypted_data == original_data
    
    def test_pii_encryption(self):
        """Test PII encryption"""
        encryption_manager = EncryptionManager()
        
        pii_data = {
            "ssn": "123-45-6789",
            "name": "John Doe",
            "email": "john@example.com"
        }
        
        encrypted_pii = encryption_manager.encrypt_pii(pii_data)
        decrypted_pii = encryption_manager.decrypt_pii(encrypted_pii)
        
        # SSN should be encrypted
        assert encrypted_pii["ssn"] != pii_data["ssn"]
        # Name and email should not be encrypted (not in PII fields list)
        assert encrypted_pii["name"] == pii_data["name"]
        assert encrypted_pii["email"] == pii_data["email"]
        
        # Decryption should restore original data
        assert decrypted_pii["ssn"] == pii_data["ssn"]

class TestTokenizationManager:
    """Test tokenization functionality"""
    
    def test_card_tokenization(self):
        """Test card number tokenization"""
        tokenization_manager = TokenizationManager()
        
        card_number = "4532015112830366"
        user_id = "test_user_123"
        
        result = tokenization_manager.tokenize_card_number(card_number, user_id)
        
        assert "token" in result
        assert "last_four" in result
        assert result["last_four"] == "0366"
        assert result["token"].startswith("card_")
        
        # Test detokenization
        detokenized = tokenization_manager.detokenize_card_number(result["token"], user_id)
        assert detokenized == card_number
        
        # Test unauthorized access
        unauthorized = tokenization_manager.detokenize_card_number(result["token"], "different_user")
        assert unauthorized is None

class TestRateLimiter:
    """Test rate limiting functionality"""
    
    def test_rate_limit_parsing(self):
        """Test rate limit string parsing"""
        rate_limiter = RateLimiter()
        
        count, period = rate_limiter._parse_limit_string("100 per hour")
        assert count == 100
        assert period == 3600
        
        count, period = rate_limiter._parse_limit_string("10 per minute")
        assert count == 10
        assert period == 60
    
    def test_rate_limit_enforcement(self):
        """Test rate limit enforcement"""
        rate_limiter = RateLimiter()
        
        # First request should be allowed
        allowed, info = rate_limiter.is_allowed("5 per minute", "test_client", "test_endpoint")
        assert allowed
        assert info["remaining"] == 4
        
        # Subsequent requests
        for i in range(4):
            allowed, info = rate_limiter.is_allowed("5 per minute", "test_client", "test_endpoint")
            assert allowed
        
        # 6th request should be denied
        allowed, info = rate_limiter.is_allowed("5 per minute", "test_client", "test_endpoint")
        assert not allowed
        assert info["retry_after"] > 0

if __name__ == "__main__":
    pytest.main([__file__])


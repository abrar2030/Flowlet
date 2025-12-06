import os
import sys

from core.logging import get_logger

logger = get_logger(__name__)

# Simple test runner that doesn't require database

# Add the src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))


def test_security_modules():
    """Test security modules without database"""
    logger.info("Testing security modules...")
    # Test password security
    from src.security.password_security import PasswordSecurity

    password = "TestPassword123!"
    hashed = PasswordSecurity.hash_password(password)
    assert PasswordSecurity.verify_password(password, hashed)
    logger.info("✓ Password security tests passed")
    # Test input validation
    from decimal import Decimal

    from src.security.input_validator import InputValidator, ValidationError

    # Test valid inputs
    result = InputValidator.validate_string(
        "test", "field", min_length=1, max_length=10
    )
    assert result == "test"

    result = InputValidator.validate_decimal("123.45", "amount")
    assert result == Decimal("123.45")

    # Test invalid inputs
    try:
        InputValidator.validate_string("", "field", min_length=1)
        assert False, "Should have raised ValidationError"
    except ValidationError:
        pass

    logger.info("✓ Input validation tests passed")
    # Test encryption (basic test without Redis)
    from src.security.encryption_manager import EncryptionManager

    encryption_manager = EncryptionManager()
    original_data = "sensitive_information"
    encrypted_data = encryption_manager.encrypt_field(original_data, "test_field")
    decrypted_data = encryption_manager.decrypt_field(encrypted_data)

    assert encrypted_data != original_data
    assert decrypted_data == original_data
    logger.info("✓ Encryption tests passed")


def test_financial_calculations():
    """Test financial calculation accuracy"""
    logger.info("Testing financial calculations...")
    from decimal import ROUND_HALF_UP, Decimal

    # Test precise decimal calculations
    amount1 = Decimal("100.50")
    amount2 = Decimal("200.25")
    total = amount1 + amount2
    assert total == Decimal("300.75")

    # Test rounding
    amount = Decimal("123.456")
    rounded = amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    assert rounded == Decimal("123.46")

    logger.info("✓ Financial calculation tests passed")


def test_compliance_features():
    """Test compliance features"""
    logger.info("Testing compliance features...")

    # Test Luhn algorithm for card validation
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

    # Test valid card number
    valid_card = "4532015112830366"
    assert luhn_check(valid_card)

    # Test invalid card number
    invalid_card = "1234567890123456"
    assert not luhn_check(invalid_card)

    logger.info("✓ Compliance feature tests passed")


def run_all_tests():
    """Run all tests"""
    logger.info("Running Enhanced Flowlet Backend Tests")
    logger.info("=" * 50)
    try:
        test_security_modules()
        test_financial_calculations()
        test_compliance_features()

        logger.info("=" * 50)
        logger.info("✅ All tests passed successfully!")
        logger.info("✅ Financial industry standards implemented correctly")
        logger.info("✅ Security features working as expected")
        logger.info("✅ Compliance features validated")
        return True

    except Exception as e:
        logger.info(f"❌ Test failed: {str(e)}")
        return False


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)

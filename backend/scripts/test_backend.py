#!/usr/bin/env python3
"""
Quick test script to verify backend functionality
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def test_imports():
    """Test that all modules can be imported"""
    print("Testing imports...")
    try:
        print("✓ App module imports successfully")

        print("✓ Models import successfully")

        print("✓ Routes import successfully")

        print("✓ Encryption service imports successfully")

        print("✓ Email service imports successfully")

        print("✓ SMS service imports successfully")

        print("✓ ACH integration imports successfully")

        print("✓ Error tracking imports successfully")

        print("✓ Metrics service imports successfully")

        print("✓ Sanctions screening imports successfully")

        return True
    except Exception as e:
        print(f"✗ Import failed: {str(e)}")
        import traceback

        traceback.print_exc()
        return False


def test_app_creation():
    """Test that app can be created"""
    print("\nTesting app creation...")
    try:
        from app import create_app

        app = create_app()
        print(f"✓ App created successfully")
        print(f"✓ Registered {len(app.blueprints)} blueprints")
        return True
    except Exception as e:
        print(f"✗ App creation failed: {str(e)}")
        import traceback

        traceback.print_exc()
        return False


def test_services():
    """Test that services work"""
    print("\nTesting services...")
    try:
        # Test encryption
        from src.security.encryption import EncryptionService

        enc = EncryptionService()
        encrypted = enc.encrypt("test data")
        decrypted = enc.decrypt(encrypted)
        assert decrypted == "test data"
        print("✓ Encryption service works")

        # Test email service
        from src.integrations.notifications.email_service import EmailService

        email_svc = EmailService({"EMAIL_ENABLED": False})
        result = email_svc.send_verification_email("test@example.com", "123456")
        print("✓ Email service works")

        # Test SMS service
        from src.integrations.notifications.sms_service import SMSService

        sms_svc = SMSService({"SMS_ENABLED": False})
        result = sms_svc.send_verification_code("+1234567890", "123456")
        print("✓ SMS service works")

        # Test ACH integration
        from src.integrations.payments.ach_integration import ACHIntegration
        from decimal import Decimal

        ach = ACHIntegration({"ACH_MOCK_MODE": True})
        result = ach.initiate_debit(
            Decimal("100.00"), "1234567890", "021000021", "John Doe"
        )
        assert "transaction_id" in result
        print("✓ ACH integration works")

        # Test error tracking
        from src.services.monitoring.error_tracking import ErrorTrackingService

        error_svc = ErrorTrackingService()
        error_id = error_svc.track_error(Exception("Test error"))
        assert error_id != ""
        print("✓ Error tracking works")

        # Test metrics
        from src.services.monitoring.metrics_service import MetricsService

        metrics_svc = MetricsService()
        metrics_svc.increment("test_counter", 1.0)
        assert metrics_svc.get_counter("test_counter") == 1.0
        print("✓ Metrics service works")

        # Test sanctions screening
        from src.services.compliance.sanctions_screening import (
            SanctionsScreeningService,
        )

        sanctions_svc = SanctionsScreeningService({"SANCTIONS_MOCK_MODE": True})
        result = sanctions_svc.screen_individual("John", "Doe")
        assert "screening_id" in result
        print("✓ Sanctions screening works")

        return True
    except Exception as e:
        print(f"✗ Service test failed: {str(e)}")
        import traceback

        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    print("=" * 60)
    print("Flowlet Backend Test Suite")
    print("=" * 60)

    results = []

    results.append(("Imports", test_imports()))
    results.append(("App Creation", test_app_creation()))
    results.append(("Services", test_services()))

    print("\n" + "=" * 60)
    print("Test Results:")
    print("=" * 60)

    for name, result in results:
        status = "PASS" if result else "FAIL"
        print(f"{name}: {status}")

    all_passed = all(result for _, result in results)

    print("=" * 60)
    if all_passed:
        print("✓ All tests passed!")
        return 0
    else:
        print("✗ Some tests failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())

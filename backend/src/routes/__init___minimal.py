"""
Minimal routes initialization - importing only working routes
"""

from flask import Blueprint

# Create main API blueprint
api_bp = Blueprint("api", __name__, url_prefix="/api/v1")

# Import working routes only
try:
    from .auth import auth_bp

    api_bp.register_blueprint(auth_bp)
    print("✓ Registered: auth")
except Exception as e:
    print(f"✗ Could not register auth: {e}")

try:
    from .user import user_bp

    api_bp.register_blueprint(user_bp)
    print("✓ Registered: user")
except Exception as e:
    print(f"✗ Could not register user: {e}")

try:
    from .wallet import wallet_bp

    api_bp.register_blueprint(wallet_bp)
    print("✓ Registered: wallet")
except Exception as e:
    print(f"✗ Could not register wallet: {e}")

try:
    from .payment import payment_bp

    api_bp.register_blueprint(payment_bp)
    print("✓ Registered: payment")
except Exception as e:
    print(f"✗ Could not register payment: {e}")

try:
    from .ledger import ledger_bp

    api_bp.register_blueprint(ledger_bp)
    print("✓ Registered: ledger")
except Exception as e:
    print(f"✗ Could not register ledger: {e}")

try:
    from .card import card_bp

    api_bp.register_blueprint(card_bp)
    print("✓ Registered: card")
except Exception as e:
    print(f"✗ Could not register card: {e}")

try:
    from .kyc import kyc_bp

    api_bp.register_blueprint(kyc_bp)
    print("✓ Registered: kyc")
except Exception as e:
    print(f"✗ Could not register kyc: {e}")

try:
    from .monitoring import monitoring_bp

    api_bp.register_blueprint(monitoring_bp)
    print("✓ Registered: monitoring")
except Exception as e:
    print(f"✗ Could not register monitoring: {e}")

try:
    from .security import security_bp

    api_bp.register_blueprint(security_bp)
    print("✓ Registered: security")
except Exception as e:
    print(f"✗ Could not register security: {e}")

try:
    from .multicurrency import multicurrency_bp

    api_bp.register_blueprint(multicurrency_bp)
    print("✓ Registered: multicurrency")
except Exception as e:
    print(f"✗ Could not register multicurrency: {e}")

try:
    from .api_gateway import api_gateway_bp

    api_bp.register_blueprint(api_gateway_bp)
    print("✓ Registered: api_gateway")
except Exception as e:
    print(f"✗ Could not register api_gateway: {e}")

try:
    from .banking_integrations import banking_integrations_bp

    api_bp.register_blueprint(banking_integrations_bp)
    print("✓ Registered: banking_integrations")
except Exception as e:
    print(f"✗ Could not register banking_integrations: {e}")

# Analytics, compliance, fraud detection, kyc_aml, and ai_service may have issues
# Register them if possible
try:
    from .analytics import analytics_bp

    api_bp.register_blueprint(analytics_bp)
    print("✓ Registered: analytics")
except Exception as e:
    print(f"✗ Could not register analytics: {e}")

try:
    from .compliance import compliance_bp

    api_bp.register_blueprint(compliance_bp)
    print("✓ Registered: compliance")
except Exception as e:
    print(f"✗ Could not register compliance: {e}")

try:
    from .fraud_detection import fraud_detection_bp

    api_bp.register_blueprint(fraud_detection_bp)
    print("✓ Registered: fraud_detection")
except Exception as e:
    print(f"✗ Could not register fraud_detection: {e}")

try:
    from .kyc_aml import kyc_aml_bp

    api_bp.register_blueprint(kyc_aml_bp)
    print("✓ Registered: kyc_aml")
except Exception as e:
    print(f"✗ Could not register kyc_aml: {e}")

try:
    from .ai_service import ai_service_bp

    api_bp.register_blueprint(ai_service_bp)
    print("✓ Registered: ai_service")
except Exception as e:
    print(f"✗ Could not register ai_service: {e}")

print(f"\n✓ Total registered blueprints: {len(api_bp.blueprints)}")

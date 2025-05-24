import pytest
from src.wallet.models import Wallet
from src.payments.models import Payment
from src.wallet.services import WalletService
from src.payments.services import PaymentService

@pytest.fixture
def wallet_service():
    return WalletService()

@pytest.fixture
def payment_service():
    return PaymentService()

@pytest.fixture
def source_wallet():
    wallet = Wallet(
        id="wallet-source",
        owner_id="user-123",
        type="individual",
        currency="USD",
        status="active",
        balance=1000
    )
    return wallet

@pytest.fixture
def destination_wallet():
    wallet = Wallet(
        id="wallet-destination",
        owner_id="user-456",
        type="individual",
        currency="USD",
        status="active",
        balance=0
    )
    return wallet

def test_wallet_to_wallet_transfer(wallet_service, payment_service, source_wallet, destination_wallet):
    # Create a payment between wallets
    payment = payment_service.create_payment(
        source_id=source_wallet.id,
        source_type="wallet",
        destination_id=destination_wallet.id,
        destination_type="wallet",
        amount=500,
        currency="USD",
        description="Test transfer"
    )
    
    # Verify payment was created correctly
    assert payment.id is not None
    assert payment.status == "pending"
    assert payment.amount == 500
    assert payment.currency == "USD"
    
    # Process the payment
    processed_payment = payment_service.process_payment(payment.id)
    assert processed_payment.status == "completed"
    
    # Verify wallet balances were updated
    updated_source = wallet_service.get_wallet(source_wallet.id)
    updated_destination = wallet_service.get_wallet(destination_wallet.id)
    
    assert updated_source.balance == 500
    assert updated_destination.balance == 500

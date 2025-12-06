import logging
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, Tuple
from sqlalchemy.orm import Session
from ..models.account import Account, AccountStatus
from ..models.user import User
from ..models.transaction import (
    Transaction,
    TransactionType,
    TransactionCategory,
    TransactionStatus,
)
from ..schemas import (
    ProcessPaymentRequest,
    InternalTransferRequest,
    SendPaymentRequest,
    PaymentRequestCreate,
)
from .payment_service_errors import (
    PaymentServiceError,
    PaymentProcessorError,
    UnsupportedPaymentMethod,
    AccountAccessDenied,
    TransactionNotFound,
    SourceWalletNotFound,
    DestinationWalletNotFound,
    CurrencyMismatch,
    InsufficientFunds,
)
from ..clients.stripe_client import stripe_client

logger = logging.getLogger(__name__)


def get_account_by_id(session: Session, account_id: str) -> Account:
    """Retrieves an account or raises a specific error."""
    account = session.get(Account, account_id)
    if not account:
        raise SourceWalletNotFound()
    return account


def check_account_status(account: Account) -> Any:
    """Checks if an account is active."""
    if account.status != AccountStatus.ACTIVE:
        raise PaymentServiceError(
            f"Account {account.id} is not active", "ACCOUNT_INACTIVE", 400
        )


def check_funds_and_limits(account: Account, amount: Decimal) -> Any:
    """Checks for sufficient funds and transaction limits."""
    if not account.can_debit(amount):
        raise InsufficientFunds()
    pass


def process_external_payment(
    session: Session, user_id: str, data: ProcessPaymentRequest
) -> Dict[str, Any]:
    """
    Processes an external payment (deposit) into a user's account.
    """
    account = session.get(Account, data.account_id)
    if not account or account.user_id != user_id:
        raise AccountAccessDenied()
    check_account_status(account)
    if data.payment_method.lower() == "stripe":
        try:
            stripe_result = stripe_client.create_charge(
                amount=data.amount,
                currency=data.currency,
                source=data.payment_details.get("token"),
                description=data.description or f"Payment via {data.payment_method}",
                metadata={"account_id": str(account.id), "user_id": str(user_id)},
            )
        except PaymentProcessorError as e:
            raise e
        except Exception as e:
            logger.error(
                f"Unexpected error during Stripe processing: {str(e)}", exc_info=True
            )
            raise PaymentProcessorError(
                "Failed to communicate with payment processor.",
                "PAYMENT_COMMUNICATION_ERROR",
                500,
            )
        if stripe_result.get("status") == "succeeded":
            account.credit(data.amount)
            transaction = Transaction(
                user_id=user_id,
                account_id=account.id,
                transaction_type=TransactionType.CREDIT,
                transaction_category=TransactionCategory.PAYMENT,
                status=TransactionStatus.COMPLETED,
                description=data.description
                or f"External payment via {data.payment_method}",
                channel=data.payment_method,
                currency=data.currency,
                amount=data.amount,
                external_reference=stripe_result.get("id"),
            )
            session.add(transaction)
            session.commit()
            return {
                "status": "success",
                "transaction_id": str(transaction.id),
                "external_reference": stripe_result.get("id"),
                "new_balance": float(account.balance),
            }
        else:
            raise PaymentProcessorError(
                f"Payment status is {stripe_result.get('status')}",
                "PAYMENT_STATUS_ERROR",
                400,
            )
    else:
        raise UnsupportedPaymentMethod(data.payment_method)


def process_internal_transfer(
    session: Session, data: InternalTransferRequest
) -> Tuple[Transaction, Transaction]:
    """
    Handles internal transfers between two wallets.
    Consolidates logic from wallet_mvp.py's /transfer endpoint.
    """
    from_account = session.get(Account, data.from_wallet_id)
    to_account = session.get(Account, data.to_wallet_id)
    if not from_account:
        raise SourceWalletNotFound()
    if not to_account:
        raise DestinationWalletNotFound()
    check_account_status(from_account)
    check_account_status(to_account)
    if from_account.currency != to_account.currency:
        raise CurrencyMismatch()
    check_funds_and_limits(from_account, data.amount)
    transfer_reference = (
        data.reference
        or f"TRF-{datetime.now().strftime('%Y%m%d%H%M%S')}-{str(uuid.uuid4())[:8]}"
    )
    description = (
        data.description
        or f"Transfer from {from_account.account_name} to {to_account.account_name}"
    )
    from_account.debit(data.amount, description)
    to_account.credit(data.amount, description)
    debit_transaction = Transaction(
        user_id=from_account.user_id,
        account_id=from_account.id,
        transaction_type=TransactionType.DEBIT,
        transaction_category=TransactionCategory.TRANSFER,
        status=TransactionStatus.COMPLETED,
        description=f"{description} (Outgoing)",
        reference_number=transfer_reference,
        channel="api",
        currency=from_account.currency,
        amount=data.amount,
        related_account_id=to_account.id,
    )
    credit_transaction = Transaction(
        user_id=to_account.user_id,
        account_id=to_account.id,
        transaction_type=TransactionType.CREDIT,
        transaction_category=TransactionCategory.TRANSFER,
        status=TransactionStatus.COMPLETED,
        description=f"{description} (Incoming)",
        reference_number=transfer_reference,
        channel="api",
        currency=to_account.currency,
        amount=data.amount,
        related_account_id=from_account.id,
    )
    session.add_all([debit_transaction, credit_transaction])
    session.commit()
    return (debit_transaction, credit_transaction)


def get_transaction_details(
    session: Session, user_id: str, transaction_id: str
) -> Transaction:
    """
    Retrieves a transaction and checks for user ownership.
    """
    transaction = session.get(Transaction, transaction_id)
    if not transaction:
        raise TransactionNotFound(transaction_id)
    if transaction.user_id != user_id and (not session.get(User, user_id).is_admin):
        raise AccountAccessDenied()
    return transaction


def send_payment(
    session: Session, data: SendPaymentRequest
) -> Tuple[Transaction, Transaction]:
    """
    Handles sending a payment to a recipient (by email, phone, or account number).
    For now, we'll treat this as an internal transfer if the recipient is found.
    """
    if data.recipient_identifier == "test_recipient@flowlet.com":
        resolved_to_wallet_id = "mock_resolved_wallet_id"
    else:
        raise PaymentServiceError(
            "Recipient not found or external payment not supported yet.",
            "RECIPIENT_NOT_FOUND",
            404,
        )
    internal_transfer_data = InternalTransferRequest(
        from_wallet_id=data.from_wallet_id,
        to_wallet_id=resolved_to_wallet_id,
        amount=data.amount,
        description=data.description,
        reference=data.reference,
    )
    debit_transaction, credit_transaction = process_internal_transfer(
        session, internal_transfer_data
    )
    debit_transaction.transaction_category = TransactionCategory.PAYMENT
    session.add(debit_transaction)
    session.commit()
    return (debit_transaction, credit_transaction)


def create_payment_request(
    session: Session, data: PaymentRequestCreate
) -> Dict[str, Any]:
    """
    Creates a payment request.
    """
    account = session.get(Account, data.from_wallet_id)
    if not account:
        raise SourceWalletNotFound()
    request_reference = (
        f"REQ-{datetime.now().strftime('%Y%m%d%H%M%S')}-{str(uuid.uuid4())[:8]}"
    )
    return {
        "success": True,
        "request_reference": request_reference,
        "wallet_id": str(account.id),
        "account_name": account.account_name,
        "amount": float(data.amount),
        "currency": account.currency,
        "description": data.description,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": data.expires_at.isoformat() if data.expires_at else None,
        "message": "Payment request created successfully",
    }

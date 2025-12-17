from typing import Any
import logging
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import select
from ..models.account import Account, AccountStatus, AccountType
from ..models.transaction import (
    Transaction,
    TransactionType,
    TransactionCategory,
    TransactionStatus,
)
from ..models.user import User
from ..schemas import (
    DepositFundsRequest,
    WithdrawFundsRequest,
    TransferFundsRequest,
    CreateWalletRequest,
)

logger = logging.getLogger(__name__)


class WalletServiceError(Exception):
    """Base exception for wallet service errors."""

    def __init__(self, message: str, error_code: str, status_code: int = 400) -> Any:
        super().__init__(message)
        self.error_code = error_code
        self.status_code = status_code


class AccountNotFound(WalletServiceError):

    def __init__(self, account_id: str) -> Any:
        super().__init__(
            f"Account with ID {account_id} not found", "ACCOUNT_NOT_FOUND", 404
        )


class UserNotFound(WalletServiceError):

    def __init__(self, user_id: str) -> Any:
        super().__init__(f"User with ID {user_id} not found", "USER_NOT_FOUND", 404)


class AccountInactive(WalletServiceError):

    def __init__(self, account_id: str) -> Any:
        super().__init__(f"Account {account_id} is not active", "ACCOUNT_INACTIVE", 400)


class InsufficientFunds(WalletServiceError):

    def __init__(self, account_id: str) -> Any:
        super().__init__(
            f"Insufficient funds in account {account_id}", "INSUFFICIENT_FUNDS", 400
        )


class CurrencyMismatch(WalletServiceError):

    def __init__(self) -> Any:
        super().__init__(
            "Currency mismatch for internal transfer", "CURRENCY_MISMATCH", 400
        )


class InvalidAccountType(WalletServiceError):

    def __init__(self, account_type: str) -> Any:
        super().__init__(
            f"Invalid account type: {account_type}", "INVALID_ACCOUNT_TYPE", 400
        )


class UnsupportedCurrency(WalletServiceError):

    def __init__(self, currency: str) -> Any:
        super().__init__(
            f"Unsupported currency: {currency}", "UNSUPPORTED_CURRENCY", 400
        )


def get_account_by_id(session: Session, account_id: str) -> Account:
    """Retrieves an account or raises AccountNotFound."""
    account = session.get(Account, account_id)
    if not account:
        raise AccountNotFound(account_id)
    return account


def create_wallet(session: Session, user_id: str, data: CreateWalletRequest) -> Account:
    """Creates a new wallet for a user."""
    user = session.get(User, user_id)
    if not user:
        raise UserNotFound(user_id)
    account_type_str = data.account_type.lower()
    try:
        account_type = AccountType(account_type_str)
    except ValueError:
        raise InvalidAccountType(data.account_type)
    supported_currencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD"]
    currency = data.currency.upper()
    if currency not in supported_currencies:
        raise UnsupportedCurrency(currency)
    account = Account(
        user_id=user.id,
        account_name=data.account_name,
        account_type=account_type,
        currency=currency,
        status=AccountStatus.ACTIVE,
    )
    initial_deposit = data.initial_deposit
    if initial_deposit > Decimal("0.00"):
        account.set_available_balance(initial_deposit)
        account.set_current_balance(initial_deposit)
    session.add(account)
    session.flush()
    if initial_deposit > Decimal("0.00"):
        deposit_transaction = Transaction(
            user_id=user.id,
            account_id=account.id,
            transaction_type=TransactionType.CREDIT,
            transaction_category=TransactionCategory.DEPOSIT,
            status=TransactionStatus.COMPLETED,
            description=f"Initial deposit for account {account.account_name}",
            channel="api",
            currency=currency,
            amount=initial_deposit,
        )
        session.add(deposit_transaction)
    session.commit()
    logger.info(f"Created new wallet for user {user.id}: {account.id}")
    return account


def process_deposit(
    session: Session, account_id: str, data: DepositFundsRequest
) -> Transaction:
    """Handles the deposit of funds into an account."""
    account = get_account_by_id(session, account_id)
    if account.status != AccountStatus.ACTIVE:
        raise AccountInactive(account_id)
    amount = data.amount
    account.credit(amount)
    transaction = Transaction(
        user_id=account.user_id,
        account_id=account.id,
        transaction_type=TransactionType.CREDIT,
        transaction_category=TransactionCategory.DEPOSIT,
        status=TransactionStatus.COMPLETED,
        description=data.description or f"Deposit to {account.account_name}",
        channel=data.channel,
        currency=account.currency,
        amount=amount,
    )
    session.add(transaction)
    session.commit()
    return transaction


def process_withdrawal(
    session: Session, account_id: str, data: WithdrawFundsRequest
) -> Transaction:
    """Handles the withdrawal of funds from an account."""
    account = get_account_by_id(session, account_id)
    if account.status != AccountStatus.ACTIVE:
        raise AccountInactive(account_id)
    amount = data.amount
    if account.balance < amount:
        raise InsufficientFunds(account_id)
    account.debit(amount)
    transaction = Transaction(
        user_id=account.user_id,
        account_id=account.id,
        transaction_type=TransactionType.DEBIT,
        transaction_category=TransactionCategory.WITHDRAWAL,
        status=TransactionStatus.COMPLETED,
        description=data.description or f"Withdrawal from {account.account_name}",
        channel=data.channel,
        currency=account.currency,
        amount=amount,
    )
    session.add(transaction)
    session.commit()
    return transaction


def process_transfer(
    session: Session, source_account_id: str, data: TransferFundsRequest
) -> tuple[Transaction, Transaction]:
    """Handles the transfer of funds between two accounts."""
    source_account = get_account_by_id(session, source_account_id)
    destination_account = get_account_by_id(session, data.destination_account_id)
    if (
        source_account.status != AccountStatus.ACTIVE
        or destination_account.status != AccountStatus.ACTIVE
    ):
        raise AccountInactive(f"{source_account_id} or {data.destination_account_id}")
    amount = data.amount
    if source_account.balance < amount:
        raise InsufficientFunds(source_account_id)
    if source_account.currency != destination_account.currency:
        raise CurrencyMismatch()
    source_account.debit(amount)
    destination_account.credit(amount)
    description = (
        data.description
        or f"Transfer from {source_account.account_name} to {destination_account.account_name}"
    )
    debit_transaction = Transaction(
        user_id=source_account.user_id,
        account_id=source_account.id,
        transaction_type=TransactionType.DEBIT,
        transaction_category=TransactionCategory.TRANSFER,
        status=TransactionStatus.COMPLETED,
        description=description,
        channel=data.channel,
        currency=source_account.currency,
        amount=amount,
        related_account_id=destination_account.id,
    )
    credit_transaction = Transaction(
        user_id=destination_account.user_id,
        account_id=destination_account.id,
        transaction_type=TransactionType.CREDIT,
        transaction_category=TransactionCategory.TRANSFER,
        status=TransactionStatus.COMPLETED,
        description=description,
        channel=data.channel,
        currency=destination_account.currency,
        amount=amount,
        related_account_id=source_account.id,
    )
    session.add_all([debit_transaction, credit_transaction])
    session.commit()
    return (debit_transaction, credit_transaction)


def get_user_accounts(session: Session, user_id: str) -> list[Account]:
    """Gets all accounts for a given user."""
    accounts_stmt = select(Account).filter_by(user_id=user_id)
    accounts = session.execute(accounts_stmt).scalars().all()
    return accounts


def get_account_details_with_transactions(
    session: Session, account_id: str
) -> tuple[Account, list[Transaction]]:
    """Gets account details and recent transactions."""
    account = get_account_by_id(session, account_id)
    recent_transactions_stmt = (
        select(Transaction)
        .filter_by(account_id=account.id)
        .order_by(Transaction.created_at.desc())
        .limit(10)
    )
    recent_transactions = session.execute(recent_transactions_stmt).scalars().all()
    return (account, recent_transactions)

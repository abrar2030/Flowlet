import logging
import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

"""
Banking Integration Base Classes
Provides abstract base classes for third-party banking integrations
"""


logger = logging.getLogger(__name__)


class TransactionType(Enum):
    """Transaction types for banking operations"""

    CREDIT = "credit"
    DEBIT = "debit"
    TRANSFER = "transfer"
    PAYMENT = "payment"
    REFUND = "refund"


class TransactionStatus(Enum):
    """Transaction status enumeration"""

    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    PROCESSING = "processing"


@dataclass
class BankAccount:
    """Bank account data structure"""

    account_id: str
    account_number: str
    routing_number: str
    account_type: str
    bank_name: str
    currency: str
    balance: Optional[float] = None
    available_balance: Optional[float] = None
    account_holder_name: Optional[str] = None
    iban: Optional[str] = None
    swift_code: Optional[str] = None


@dataclass
class Transaction:
    """Transaction data structure"""

    transaction_id: str
    account_id: str
    amount: float
    currency: str
    transaction_type: TransactionType
    status: TransactionStatus
    description: str
    timestamp: datetime
    reference_id: Optional[str] = None
    counterparty_account: Optional[str] = None
    counterparty_name: Optional[str] = None
    fees: Optional[float] = None
    exchange_rate: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class PaymentRequest:
    """Payment request data structure"""

    amount: float
    currency: str
    from_account: str
    to_account: str
    description: str
    reference_id: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None


class BankingIntegrationError(Exception):
    """Base exception for banking integration errors"""


class AuthenticationError(BankingIntegrationError):
    """Authentication related errors"""


class InsufficientFundsError(BankingIntegrationError):
    """Insufficient funds error"""


class InvalidAccountError(BankingIntegrationError):
    """Invalid account error"""


class TransactionLimitError(BankingIntegrationError):
    """Transaction limit exceeded error"""


class BankingIntegrationBase(ABC):
    """
    Abstract base class for banking integrations
    Defines the interface that all banking integrations must implement
    """

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
        self._authenticated = False

    @abstractmethod
    async def authenticate(self) -> bool:
        """
        Authenticate with the banking service
        Returns True if authentication successful
        """

    @abstractmethod
    async def get_accounts(self, customer_id: str) -> List[BankAccount]:
        """
        Retrieve list of accounts for a customer
        """

    @abstractmethod
    async def get_account_balance(self, account_id: str) -> Dict[str, float]:
        """
        Get account balance information
        Returns dict with 'balance' and 'available_balance'
        """

    @abstractmethod
    async def get_transactions(
        self,
        account_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: Optional[int] = None,
    ) -> List[Transaction]:
        """
        Retrieve transaction history for an account
        """

    @abstractmethod
    async def initiate_payment(self, payment_request: PaymentRequest) -> str:
        """
        Initiate a payment transaction
        Returns transaction ID
        """

    @abstractmethod
    async def get_payment_status(self, transaction_id: str) -> TransactionStatus:
        """
        Get status of a payment transaction
        """

    @abstractmethod
    async def cancel_payment(self, transaction_id: str) -> bool:
        """
        Cancel a pending payment
        Returns True if cancellation successful
        """

    def generate_reference_id(self) -> str:
        """Generate a unique reference ID for transactions"""
        return f"FLT-{uuid.uuid4().hex[:12].upper()}"

    def validate_account_number(self, account_number: str) -> bool:
        """Basic account number validation"""
        return len(account_number) >= 8 and account_number.isdigit()

    def validate_routing_number(self, routing_number: str) -> bool:
        """Basic routing number validation"""
        return len(routing_number) == 9 and routing_number.isdigit()

    def format_amount(self, amount: float, currency: str = "USD") -> str:
        """Format amount for display"""
        return f"{amount:.2f} {currency}"


class PSD2ComplianceBase(ABC):
    """
    Base class for PSD2 compliance features
    Implements Strong Customer Authentication (SCA) requirements
    """

    @abstractmethod
    async def initiate_sca(self, customer_id: str, transaction_data: Dict) -> str:
        """
        Initiate Strong Customer Authentication
        Returns SCA session ID
        """

    @abstractmethod
    async def verify_sca(self, sca_session_id: str, auth_code: str) -> bool:
        """
        Verify SCA authentication code
        """

    @abstractmethod
    async def get_consent(self, customer_id: str, scope: List[str]) -> str:
        """
        Get customer consent for data access
        Returns consent ID
        """


class OpenBankingBase(ABC):
    """
    Base class for Open Banking implementations
    Supports Account Information Services (AIS) and Payment Initiation Services (PIS)
    """

    @abstractmethod
    async def get_account_information(
        self, consent_id: str, account_id: str
    ) -> Dict[str, Any]:
        """
        Get account information using Open Banking AIS
        """

    @abstractmethod
    async def initiate_payment_pis(
        self, consent_id: str, payment_request: PaymentRequest
    ) -> str:
        """
        Initiate payment using Open Banking PIS
        """

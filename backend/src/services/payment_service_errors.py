from ..error_handlers import WalletServiceError


class PaymentServiceError(WalletServiceError):
    """Base exception for payment service errors."""


class PaymentProcessorError(PaymentServiceError):

    def __init__(
        self,
        message: str,
        error_code: str = "PAYMENT_PROCESSOR_ERROR",
        status_code: int = 400,
    ) -> Any:
        super().__init__(message, error_code, status_code)


class UnsupportedPaymentMethod(PaymentServiceError):

    def __init__(self, method: str) -> Any:
        super().__init__(
            f"Unsupported payment method: {method}", "UNSUPPORTED_PAYMENT_METHOD", 400
        )


class AccountAccessDenied(PaymentServiceError):

    def __init__(self) -> Any:
        super().__init__(
            "Account not found or access denied", "ACCOUNT_ACCESS_DENIED", 403
        )


class TransactionNotFound(PaymentServiceError):

    def __init__(self, transaction_id: str) -> Any:
        super().__init__(
            f"Transaction {transaction_id} not found", "TRANSACTION_NOT_FOUND", 404
        )


class SourceWalletNotFound(PaymentServiceError):

    def __init__(self) -> Any:
        super().__init__("Source wallet not found", "SOURCE_WALLET_NOT_FOUND", 404)


class DestinationWalletNotFound(PaymentServiceError):

    def __init__(self) -> Any:
        super().__init__(
            "Destination wallet not found", "DESTINATION_WALLET_NOT_FOUND", 404
        )


class CurrencyMismatch(PaymentServiceError):

    def __init__(self) -> Any:
        super().__init__("Currency mismatch between wallets", "CURRENCY_MISMATCH", 400)


class InsufficientFunds(PaymentServiceError):

    def __init__(self) -> Any:
        super().__init__(
            "Insufficient funds in source wallet", "INSUFFICIENT_FUNDS", 400
        )


class DailyLimitExceeded(PaymentServiceError):

    def __init__(self, message: str) -> Any:
        super().__init__(message, "DAILY_LIMIT_EXCEEDED", 400)

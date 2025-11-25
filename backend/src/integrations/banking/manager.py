import logging
from enum import Enum
from typing import Any, Dict, List, Optional, Type

from . import (BankAccount, BankingIntegrationBase, BankingIntegrationError,
               FDXIntegration, OpenBankingIntegration, PaymentRequest,
               PlaidIntegration, Transaction, TransactionStatus)

logger = logging.getLogger(__name__)


class IntegrationType(Enum):
    """Supported banking integration types"""

    PLAID = "plaid"
    OPEN_BANKING = "open_banking"
    FDX = "fdx"


class BankingIntegrationManager:
    """
    Centralized manager for all banking integrations
    Provides a unified interface for different banking APIs
    """

    def __init__(self):
        self.integrations: Dict[str, BankingIntegrationBase] = {}
        self.integration_classes: Dict[
            IntegrationType, Type[BankingIntegrationBase]
        ] = {
            IntegrationType.PLAID: PlaidIntegration,
            IntegrationType.OPEN_BANKING: OpenBankingIntegration,
            IntegrationType.FDX: FDXIntegration,
        }
        self.logger = logging.getLogger(__name__)

    def register_integration(
        self, name: str, integration_type: IntegrationType, config: Dict[str, Any]
    ) -> None:
        """
        Register a new banking integration

        Args:
            name: Unique name for this integration instance
            integration_type: Type of integration (Plaid, Open Banking, FDX)
            config: Configuration dictionary for the integration
        """
        try:
            integration_class = self.integration_classes[integration_type]
            integration = integration_class(config)
            self.integrations[name] = integration
            self.logger.info(
                f"Registered {integration_type.value} integration as '{name}'"
            )
        except Exception as e:
            self.logger.error(f"Failed to register integration '{name}': {str(e)}")
            raise BankingIntegrationError(
                f"Failed to register integration '{name}': {str(e)}"
            )

    def get_integration(self, name: str) -> BankingIntegrationBase:
        """
        Get a registered integration by name

        Args:
            name: Name of the integration

        Returns:
            BankingIntegrationBase: The integration instance
        """
        if name not in self.integrations:
            raise BankingIntegrationError(f"Integration '{name}' not found")
        return self.integrations[name]

    def list_integrations(self) -> List[str]:
        """
        List all registered integration names

        Returns:
            List[str]: List of integration names
        """
        return list(self.integrations.keys())

    async def authenticate_all(self) -> Dict[str, bool]:
        """
        Authenticate all registered integrations

        Returns:
            Dict[str, bool]: Authentication results for each integration
        """
        results = {}
        for name, integration in self.integrations.items():
            try:
                result = await integration.authenticate()
                results[name] = result
                self.logger.info(
                    f"Authentication {'successful' if result else 'failed'} for '{name}'"
                )
            except Exception as e:
                results[name] = False
                self.logger.error(f"Authentication failed for '{name}': {str(e)}")
        return results

    async def get_accounts_from_all(
        self, customer_id: str
    ) -> Dict[str, List[BankAccount]]:
        """
        Get accounts from all integrations for a customer

        Args:
            customer_id: Customer identifier

        Returns:
            Dict[str, List[BankAccount]]: Accounts grouped by integration name
        """
        results = {}
        for name, integration in self.integrations.items():
            try:
                accounts = await integration.get_accounts(customer_id)
                results[name] = accounts
                self.logger.info(f"Retrieved {len(accounts)} accounts from '{name}'")
            except Exception as e:
                results[name] = []
                self.logger.error(f"Failed to get accounts from '{name}': {str(e)}")
        return results

    async def get_all_transactions(
        self,
        account_mappings: Dict[str, str],  # integration_name -> account_id
        start_date: Optional[Any] = None,
        end_date: Optional[Any] = None,
        limit: Optional[int] = None,
    ) -> Dict[str, List[Transaction]]:
        """
        Get transactions from multiple integrations

        Args:
            account_mappings: Mapping of integration name to account ID
            start_date: Start date for transaction history
            end_date: End date for transaction history
            limit: Maximum number of transactions per integration

        Returns:
            Dict[str, List[Transaction]]: Transactions grouped by integration name
        """
        results = {}
        for integration_name, account_id in account_mappings.items():
            if integration_name not in self.integrations:
                self.logger.warning(f"Integration '{integration_name}' not found")
                continue

            try:
                integration = self.integrations[integration_name]
                transactions = await integration.get_transactions(
                    account_id, start_date, end_date, limit
                )
                results[integration_name] = transactions
                self.logger.info(
                    f"Retrieved {len(transactions)} transactions from '{integration_name}'"
                )
            except Exception as e:
                results[integration_name] = []
                self.logger.error(
                    f"Failed to get transactions from '{integration_name}': {str(e)}"
                )
        return results

    async def initiate_payment_with_fallback(
        self, payment_request: PaymentRequest, preferred_integrations: List[str] = None
    ) -> tuple[str, str]:
        """
        Initiate payment with fallback to other integrations

        Args:
            payment_request: Payment request details
            preferred_integrations: List of preferred integration names in order

        Returns:
            tuple[str, str]: (transaction_id, integration_name)
        """
        integrations_to_try = preferred_integrations or list(self.integrations.keys())

        for integration_name in integrations_to_try:
            if integration_name not in self.integrations:
                continue

            try:
                integration = self.integrations[integration_name]
                transaction_id = await integration.initiate_payment(payment_request)
                self.logger.info(
                    f"Payment initiated successfully with '{integration_name}': {transaction_id}"
                )
                return transaction_id, integration_name
            except Exception as e:
                self.logger.warning(
                    f"Payment failed with '{integration_name}': {str(e)}"
                )
                continue

        raise BankingIntegrationError("Payment failed with all available integrations")

    async def get_payment_status_multi(
        self, transaction_mappings: Dict[str, str]  # integration_name -> transaction_id
    ) -> Dict[str, TransactionStatus]:
        """
        Get payment status from multiple integrations

        Args:
            transaction_mappings: Mapping of integration name to transaction ID

        Returns:
            Dict[str, TransactionStatus]: Status for each transaction
        """
        results = {}
        for integration_name, transaction_id in transaction_mappings.items():
            if integration_name not in self.integrations:
                continue

            try:
                integration = self.integrations[integration_name]
                status = await integration.get_payment_status(transaction_id)
                results[integration_name] = status
            except Exception as e:
                self.logger.error(
                    f"Failed to get payment status from '{integration_name}': {str(e)}"
                )
                results[integration_name] = TransactionStatus.FAILED
        return results

    async def close_all(self):
        """Close all integration connections"""
        for name, integration in self.integrations.items():
            try:
                if hasattr(integration, "close"):
                    await integration.close()
                self.logger.info(f"Closed integration '{name}'")
            except Exception as e:
                self.logger.error(f"Error closing integration '{name}': {str(e)}")

    def get_integration_health(self) -> Dict[str, Dict[str, Any]]:
        """
        Get health status of all integrations

        Returns:
            Dict[str, Dict[str, Any]]: Health status for each integration
        """
        health_status = {}
        for name, integration in self.integrations.items():
            health_status[name] = {
                "authenticated": integration._authenticated,
                "type": integration.__class__.__name__,
                "config_keys": (
                    list(integration.config.keys())
                    if hasattr(integration, "config")
                    else []
                ),
            }
        return health_status

    def __del__(self):
        """Cleanup on deletion"""
        import asyncio

        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(self.close_all())
            else:
                loop.run_until_complete(self.close_all())
        except Exception:
            pass  # Ignore cleanup errors during shutdown


# Global instance for easy access
banking_manager = BankingIntegrationManager()

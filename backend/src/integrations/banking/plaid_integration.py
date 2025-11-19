"""
Plaid Banking Integration
Implements Plaid API for account aggregation and transaction data
"""

import asyncio
import json
import logging
from dataclasses import asdict
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import aiohttp

from . import (AuthenticationError, BankAccount, BankingIntegrationBase,
               BankingIntegrationError, InvalidAccountError, PaymentRequest,
               Transaction, TransactionStatus, TransactionType)

logger = logging.getLogger(__name__)


class PlaidIntegration(BankingIntegrationBase):
    """
    Plaid banking integration for account aggregation and transaction data
    Supports Link, Auth, Transactions, and Identity products
    """

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.client_id = config.get("client_id")
        self.secret = config.get("secret")
        self.environment = config.get(
            "environment", "sandbox"
        )  # sandbox, development, production
        self.base_url = self._get_base_url()
        self.session = None

    def _get_base_url(self) -> str:
        """Get Plaid API base URL based on environment"""
        urls = {
            "sandbox": "https://sandbox.plaid.com",
            "development": "https://development.plaid.com",
            "production": "https://production.plaid.com",
        }
        return urls.get(self.environment, urls["sandbox"])

    async def authenticate(self) -> bool:
        """
        Authenticate with Plaid API
        """
        try:
            self.session = aiohttp.ClientSession()

            # Test authentication with a simple API call
            headers = {
                "Content-Type": "application/json",
            }

            data = {
                "client_id": self.client_id,
                "secret": self.secret,
                "country_codes": ["US"],
                "user": {"client_user_id": "test_user"},
            }

            async with self.session.post(
                f"{self.base_url}/link/token/create", headers=headers, json=data
            ) as response:
                if response.status == 200:
                    self._authenticated = True
                    self.logger.info("Plaid authentication successful")
                    return True
                else:
                    error_data = await response.json()
                    self.logger.error(f"Plaid authentication failed: {error_data}")
                    raise AuthenticationError(
                        f"Plaid authentication failed: {error_data}"
                    )

        except Exception as e:
            self.logger.error(f"Plaid authentication error: {str(e)}")
            raise AuthenticationError(f"Plaid authentication error: {str(e)}")

    async def exchange_public_token(self, public_token: str) -> str:
        """
        Exchange public token for access token
        """
        if not self._authenticated:
            await self.authenticate()

        data = {
            "client_id": self.client_id,
            "secret": self.secret,
            "public_token": public_token,
        }

        async with self.session.post(
            f"{self.base_url}/link/token/exchange", json=data
        ) as response:
            if response.status == 200:
                result = await response.json()
                return result["access_token"]
            else:
                error_data = await response.json()
                raise BankingIntegrationError(f"Token exchange failed: {error_data}")

    async def get_accounts(self, access_token: str) -> List[BankAccount]:
        """
        Retrieve accounts using Plaid Auth product
        """
        if not self._authenticated:
            await self.authenticate()

        data = {
            "client_id": self.client_id,
            "secret": self.secret,
            "access_token": access_token,
        }

        async with self.session.post(
            f"{self.base_url}/auth/get", json=data
        ) as response:
            if response.status == 200:
                result = await response.json()
                accounts = []

                for account_data in result["accounts"]:
                    account = BankAccount(
                        account_id=account_data["account_id"],
                        account_number=account_data["account"]["account_number"],
                        routing_number=account_data["account"]["routing_number"],
                        account_type=account_data["subtype"],
                        bank_name=result["item"]["institution_id"],
                        currency="USD",
                        balance=account_data["balances"]["current"],
                        available_balance=account_data["balances"]["available"],
                        account_holder_name=account_data.get("name", ""),
                    )
                    accounts.append(account)

                return accounts
            else:
                error_data = await response.json()
                raise BankingIntegrationError(f"Failed to get accounts: {error_data}")

    async def get_account_balance(
        self, access_token: str, account_id: str
    ) -> Dict[str, float]:
        """
        Get account balance information
        """
        if not self._authenticated:
            await self.authenticate()

        data = {
            "client_id": self.client_id,
            "secret": self.secret,
            "access_token": access_token,
            "options": {"account_ids": [account_id]},
        }

        async with self.session.post(
            f"{self.base_url}/accounts/balance/get", json=data
        ) as response:
            if response.status == 200:
                result = await response.json()
                if result["accounts"]:
                    balances = result["accounts"][0]["balances"]
                    return {
                        "balance": balances["current"],
                        "available_balance": balances["available"],
                    }
                else:
                    raise InvalidAccountError(f"Account {account_id} not found")
            else:
                error_data = await response.json()
                raise BankingIntegrationError(f"Failed to get balance: {error_data}")

    async def get_transactions(
        self,
        access_token: str,
        account_id: str = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: Optional[int] = 100,
    ) -> List[Transaction]:
        """
        Retrieve transaction history using Plaid Transactions product
        """
        if not self._authenticated:
            await self.authenticate()

        if not start_date:
            start_date = datetime.now() - timedelta(days=30)
        if not end_date:
            end_date = datetime.now()

        data = {
            "client_id": self.client_id,
            "secret": self.secret,
            "access_token": access_token,
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "count": limit or 100,
        }

        if account_id:
            data["options"] = {"account_ids": [account_id]}

        async with self.session.post(
            f"{self.base_url}/transactions/get", json=data
        ) as response:
            if response.status == 200:
                result = await response.json()
                transactions = []

                for txn_data in result["transactions"]:
                    # Determine transaction type based on amount
                    amount = abs(txn_data["amount"])
                    txn_type = (
                        TransactionType.DEBIT
                        if txn_data["amount"] > 0
                        else TransactionType.CREDIT
                    )

                    transaction = Transaction(
                        transaction_id=txn_data["transaction_id"],
                        account_id=txn_data["account_id"],
                        amount=amount,
                        currency=txn_data["iso_currency_code"] or "USD",
                        transaction_type=txn_type,
                        status=TransactionStatus.COMPLETED,
                        description=txn_data["name"],
                        timestamp=datetime.strptime(txn_data["date"], "%Y-%m-%d"),
                        counterparty_name=txn_data.get("merchant_name"),
                        metadata={
                            "category": txn_data.get("category", []),
                            "location": txn_data.get("location"),
                            "payment_channel": txn_data.get("payment_channel"),
                        },
                    )
                    transactions.append(transaction)

                return transactions
            else:
                error_data = await response.json()
                raise BankingIntegrationError(
                    f"Failed to get transactions: {error_data}"
                )

    async def initiate_payment(self, payment_request: PaymentRequest) -> str:
        """
        Initiate payment using Plaid Transfer (requires additional setup)
        Note: This is a simplified implementation
        """
        # Plaid Transfer requires additional authorization and setup
        # This is a placeholder implementation
        raise NotImplementedError(
            "Plaid Transfer integration requires additional setup"
        )

    async def get_payment_status(self, transaction_id: str) -> TransactionStatus:
        """
        Get payment status (placeholder for Plaid Transfer)
        """
        raise NotImplementedError(
            "Plaid Transfer integration requires additional setup"
        )

    async def cancel_payment(self, transaction_id: str) -> bool:
        """
        Cancel payment (placeholder for Plaid Transfer)
        """
        raise NotImplementedError(
            "Plaid Transfer integration requires additional setup"
        )

    async def get_identity(self, access_token: str) -> Dict[str, Any]:
        """
        Get identity information using Plaid Identity product
        """
        if not self._authenticated:
            await self.authenticate()

        data = {
            "client_id": self.client_id,
            "secret": self.secret,
            "access_token": access_token,
        }

        async with self.session.post(
            f"{self.base_url}/identity/get", json=data
        ) as response:
            if response.status == 200:
                result = await response.json()
                return result
            else:
                error_data = await response.json()
                raise BankingIntegrationError(f"Failed to get identity: {error_data}")

    async def create_link_token(self, user_id: str, products: List[str] = None) -> str:
        """
        Create a Link token for Plaid Link initialization
        """
        if not self._authenticated:
            await self.authenticate()

        if not products:
            products = ["auth", "transactions", "identity"]

        data = {
            "client_id": self.client_id,
            "secret": self.secret,
            "client_name": "Flowlet",
            "country_codes": ["US"],
            "language": "en",
            "user": {"client_user_id": user_id},
            "products": products,
        }

        async with self.session.post(
            f"{self.base_url}/link/token/create", json=data
        ) as response:
            if response.status == 200:
                result = await response.json()
                return result["link_token"]
            else:
                error_data = await response.json()
                raise BankingIntegrationError(
                    f"Failed to create link token: {error_data}"
                )

    async def close(self):
        """Close the HTTP session"""
        if self.session:
            await self.session.close()

    def __del__(self):
        """Cleanup on deletion"""
        if self.session and not self.session.closed:
            asyncio.create_task(self.session.close())

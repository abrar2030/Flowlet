import asyncio
import logging
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import aiohttp

logger = logging.getLogger(__name__)


class FDXIntegration(BankingIntegrationBase):
    """
    FDX (Financial Data Exchange) integration for North American banks
    Implements FDX API standards for secure financial data sharing
    """

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.client_id = config.get("client_id")
        self.client_secret = config.get("client_secret")
        self.base_url = config.get("base_url")
        self.redirect_uri = config.get("redirect_uri")
        self.session = None
        self.access_token = None
        self.token_expires_at = None

    async def authenticate(self) -> bool:
        """
        Authenticate with FDX API using OAuth2
        """
        try:
            self.session = aiohttp.ClientSession()

            # Get access token using client credentials flow
            token_data = {
                "grant_type": "client_credentials",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "scope": "FDX:accountbasic FDX:accountdetailed FDX:transactions",
            }

            headers = {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
            }

            async with self.session.post(
                f"{self.base_url}/token", headers=headers, data=token_data
            ) as response:
                if response.status == 200:
                    token_response = await response.json()
                    self.access_token = token_response["access_token"]
                    expires_in = token_response.get("expires_in", 3600)
                    self.token_expires_at = datetime.now() + timedelta(
                        seconds=expires_in
                    )
                    self._authenticated = True
                    self.logger.info("FDX authentication successful")
                    return True
                else:
                    error_data = await response.text()
                    self.logger.error(f"FDX authentication failed: {error_data}")
                    raise AuthenticationError(
                        f"FDX authentication failed: {error_data}"
                    )

        except Exception as e:
            self.logger.error(f"FDX authentication error: {str(e)}")
            raise AuthenticationError(f"FDX authentication error: {str(e)}")

    async def _ensure_authenticated(self):
        """Ensure we have a valid access token"""
        if not self._authenticated or (
            self.token_expires_at and datetime.now() >= self.token_expires_at
        ):
            await self.authenticate()

    async def get_accounts(self, customer_id: str) -> List[BankAccount]:
        """
        Retrieve accounts using FDX Account API
        """
        await self._ensure_authenticated()

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Accept": "application/json",
            "Idempotency-Key": str(uuid.uuid4()),
        }

        async with self.session.get(
            f"{self.base_url}/accounts",
            headers=headers,
            params={"customerId": customer_id},
        ) as response:
            if response.status == 200:
                result = await response.json()
                accounts = []

                for account_data in result.get("accounts", []):
                    # Map FDX account types to our standard types
                    account_type_mapping = {
                        "CHECKING": "checking",
                        "SAVINGS": "savings",
                        "MONEY_MARKET": "money_market",
                        "CERTIFICATE_OF_DEPOSIT": "cd",
                        "CREDIT_CARD": "credit",
                        "LINE_OF_CREDIT": "credit_line",
                        "INVESTMENT": "investment",
                        "LOAN": "loan",
                    }

                    account = BankAccount(
                        account_id=account_data["accountId"],
                        account_number=account_data.get("accountNumber", ""),
                        routing_number=account_data.get("routingNumber", ""),
                        account_type=account_type_mapping.get(
                            account_data.get("accountType"), "unknown"
                        ),
                        bank_name=account_data.get("fiName", ""),
                        currency=account_data.get("currency", "USD"),
                        balance=account_data.get("currentBalance"),
                        available_balance=account_data.get("availableBalance"),
                        account_holder_name=account_data.get("accountName", ""),
                    )
                    accounts.append(account)

                return accounts
            else:
                error_data = await response.json()
                raise BankingIntegrationError(f"Failed to get accounts: {error_data}")

    async def get_account_balance(self, account_id: str) -> Dict[str, float]:
        """
        Get account balance using FDX Account API
        """
        await self._ensure_authenticated()

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Accept": "application/json",
            "Idempotency-Key": str(uuid.uuid4()),
        }

        async with self.session.get(
            f"{self.base_url}/accounts/{account_id}", headers=headers
        ) as response:
            if response.status == 200:
                result = await response.json()
                return {
                    "balance": result.get("currentBalance", 0.0),
                    "available_balance": result.get("availableBalance", 0.0),
                }
            else:
                error_data = await response.json()
                raise BankingIntegrationError(f"Failed to get balance: {error_data}")

    async def get_transactions(
        self,
        account_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: Optional[int] = None,
    ) -> List[Transaction]:
        """
        Retrieve transaction history using FDX Transaction API
        """
        await self._ensure_authenticated()

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Accept": "application/json",
            "Idempotency-Key": str(uuid.uuid4()),
        }

        params = {}
        if start_date:
            params["startTime"] = start_date.isoformat()
        if end_date:
            params["endTime"] = end_date.isoformat()
        if limit:
            params["limit"] = limit

        async with self.session.get(
            f"{self.base_url}/accounts/{account_id}/transactions",
            headers=headers,
            params=params,
        ) as response:
            if response.status == 200:
                result = await response.json()
                transactions = []

                for txn_data in result.get("transactions", []):
                    # Map FDX transaction types
                    txn_type_mapping = {
                        "CREDIT": TransactionType.CREDIT,
                        "DEBIT": TransactionType.DEBIT,
                        "TRANSFER": TransactionType.TRANSFER,
                        "PAYMENT": TransactionType.PAYMENT,
                        "REFUND": TransactionType.REFUND,
                    }

                    # Map FDX transaction status
                    status_mapping = {
                        "POSTED": TransactionStatus.COMPLETED,
                        "PENDING": TransactionStatus.PENDING,
                        "CANCELLED": TransactionStatus.CANCELLED,
                        "FAILED": TransactionStatus.FAILED,
                    }

                    transaction = Transaction(
                        transaction_id=txn_data["transactionId"],
                        account_id=account_id,
                        amount=abs(float(txn_data["amount"])),
                        currency=txn_data.get("currency", "USD"),
                        transaction_type=txn_type_mapping.get(
                            txn_data.get("transactionType"), TransactionType.DEBIT
                        ),
                        status=status_mapping.get(
                            txn_data.get("status"), TransactionStatus.COMPLETED
                        ),
                        description=txn_data.get("description", ""),
                        timestamp=datetime.fromisoformat(
                            txn_data["postedTimestamp"].replace("Z", "+00:00")
                        ),
                        counterparty_name=txn_data.get("payeeName"),
                        reference_id=txn_data.get("referenceNumber"),
                        fees=txn_data.get("feeAmount"),
                        metadata={
                            "category": txn_data.get("category"),
                            "subcategory": txn_data.get("subcategory"),
                            "merchantCategoryCode": txn_data.get(
                                "merchantCategoryCode"
                            ),
                            "checkNumber": txn_data.get("checkNumber"),
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
        Initiate payment using FDX Payment API
        """
        await self._ensure_authenticated()

        payment_data = {
            "paymentId": str(uuid.uuid4()),
            "amount": payment_request.amount,
            "currency": payment_request.currency,
            "fromAccountId": payment_request.from_account,
            "toAccountId": payment_request.to_account,
            "description": payment_request.description,
            "referenceNumber": payment_request.reference_id
            or self.generate_reference_id(),
        }

        if payment_request.scheduled_date:
            payment_data["scheduledDate"] = payment_request.scheduled_date.isoformat()

        if payment_request.metadata:
            payment_data.update(payment_request.metadata)

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Idempotency-Key": str(uuid.uuid4()),
        }

        async with self.session.post(
            f"{self.base_url}/payments", headers=headers, json=payment_data
        ) as response:
            if response.status == 201:
                result = await response.json()
                return result["paymentId"]
            else:
                error_data = await response.json()
                raise BankingIntegrationError(
                    f"Failed to initiate payment: {error_data}"
                )

    async def get_payment_status(self, transaction_id: str) -> TransactionStatus:
        """
        Get payment status using FDX Payment API
        """
        await self._ensure_authenticated()

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Accept": "application/json",
            "Idempotency-Key": str(uuid.uuid4()),
        }

        async with self.session.get(
            f"{self.base_url}/payments/{transaction_id}", headers=headers
        ) as response:
            if response.status == 200:
                result = await response.json()
                status_mapping = {
                    "SUBMITTED": TransactionStatus.PENDING,
                    "PROCESSING": TransactionStatus.PROCESSING,
                    "COMPLETED": TransactionStatus.COMPLETED,
                    "FAILED": TransactionStatus.FAILED,
                    "CANCELLED": TransactionStatus.CANCELLED,
                }
                return status_mapping.get(
                    result.get("status"), TransactionStatus.PENDING
                )
            else:
                error_data = await response.json()
                raise BankingIntegrationError(
                    f"Failed to get payment status: {error_data}"
                )

    async def cancel_payment(self, transaction_id: str) -> bool:
        """
        Cancel payment using FDX Payment API
        """
        await self._ensure_authenticated()

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Idempotency-Key": str(uuid.uuid4()),
        }

        cancel_data = {
            "status": "CANCELLED",
            "reason": "Customer requested cancellation",
        }

        async with self.session.patch(
            f"{self.base_url}/payments/{transaction_id}",
            headers=headers,
            json=cancel_data,
        ) as response:
            return response.status == 200

    async def get_account_details(self, account_id: str) -> Dict[str, Any]:
        """
        Get detailed account information using FDX Account API
        """
        await self._ensure_authenticated()

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Accept": "application/json",
            "Idempotency-Key": str(uuid.uuid4()),
        }

        async with self.session.get(
            f"{self.base_url}/accounts/{account_id}/details", headers=headers
        ) as response:
            if response.status == 200:
                return await response.json()
            else:
                error_data = await response.json()
                raise BankingIntegrationError(
                    f"Failed to get account details: {error_data}"
                )

    async def get_customer_info(self, customer_id: str) -> Dict[str, Any]:
        """
        Get customer information using FDX Customer API
        """
        await self._ensure_authenticated()

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Accept": "application/json",
            "Idempotency-Key": str(uuid.uuid4()),
        }

        async with self.session.get(
            f"{self.base_url}/customers/{customer_id}", headers=headers
        ) as response:
            if response.status == 200:
                return await response.json()
            else:
                error_data = await response.json()
                raise BankingIntegrationError(
                    f"Failed to get customer info: {error_data}"
                )

    async def close(self):
        """Close the HTTP session"""
        if self.session:
            await self.session.close()

    def __del__(self):
        """Cleanup on deletion"""
        if self.session and not self.session.closed:
            asyncio.create_task(self.session.close())

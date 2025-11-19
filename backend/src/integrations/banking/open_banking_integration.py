"""
Open Banking Integration
Implements PSD2-compliant Open Banking APIs for European banks
"""

import asyncio
import json
import logging
import uuid
from dataclasses import asdict
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import aiohttp
import jwt

from . import (
    AuthenticationError,
    BankAccount,
    BankingIntegrationBase,
    BankingIntegrationError,
    InvalidAccountError,
    OpenBankingBase,
    PaymentRequest,
    PSD2ComplianceBase,
    Transaction,
    TransactionStatus,
    TransactionType,
)

logger = logging.getLogger(__name__)


class OpenBankingIntegration(
    BankingIntegrationBase, PSD2ComplianceBase, OpenBankingBase
):
    """
    Open Banking integration implementing PSD2 compliance
    Supports Account Information Services (AIS) and Payment Initiation Services (PIS)
    """

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.client_id = config.get("client_id")
        self.client_secret = config.get("client_secret")
        self.certificate_path = config.get("certificate_path")
        self.private_key_path = config.get("private_key_path")
        self.base_url = config.get("base_url")
        self.redirect_uri = config.get("redirect_uri")
        self.session = None
        self.access_token = None
        self.token_expires_at = None

    async def authenticate(self) -> bool:
        """
        Authenticate with Open Banking API using OAuth2 with mutual TLS
        """
        try:
            # Create SSL context with client certificate
            ssl_context = self._create_ssl_context()

            connector = aiohttp.TCPConnector(ssl=ssl_context)
            self.session = aiohttp.ClientSession(connector=connector)

            # Get access token using client credentials flow
            token_data = {
                "grant_type": "client_credentials",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "scope": "accounts payments",
            }

            headers = {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
            }

            async with self.session.post(
                f"{self.base_url}/oauth2/token", headers=headers, data=token_data
            ) as response:
                if response.status == 200:
                    token_response = await response.json()
                    self.access_token = token_response["access_token"]
                    expires_in = token_response.get("expires_in", 3600)
                    self.token_expires_at = datetime.now() + timedelta(
                        seconds=expires_in
                    )
                    self._authenticated = True
                    self.logger.info("Open Banking authentication successful")
                    return True
                else:
                    error_data = await response.text()
                    self.logger.error(
                        f"Open Banking authentication failed: {error_data}"
                    )
                    raise AuthenticationError(
                        f"Open Banking authentication failed: {error_data}"
                    )

        except Exception as e:
            self.logger.error(f"Open Banking authentication error: {str(e)}")
            raise AuthenticationError(f"Open Banking authentication error: {str(e)}")

    def _create_ssl_context(self):
        """Create SSL context with client certificate for mutual TLS"""
        import ssl

        context = ssl.create_default_context()
        if self.certificate_path and self.private_key_path:
            context.load_cert_chain(self.certificate_path, self.private_key_path)
        return context

    async def _ensure_authenticated(self):
        """Ensure we have a valid access token"""
        if not self._authenticated or (
            self.token_expires_at and datetime.now() >= self.token_expires_at
        ):
            await self.authenticate()

    async def get_consent(self, customer_id: str, scope: List[str]) -> str:
        """
        Get customer consent for data access (PSD2 requirement)
        """
        await self._ensure_authenticated()

        consent_data = {
            "access": {"accounts": scope, "balances": scope, "transactions": scope},
            "recurringIndicator": True,
            "validUntil": (datetime.now() + timedelta(days=90)).isoformat(),
            "frequencyPerDay": 4,
            "combinedServiceIndicator": False,
        }

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
            "X-Request-ID": str(uuid.uuid4()),
            "PSU-ID": customer_id,
        }

        async with self.session.post(
            f"{self.base_url}/v1/consents", headers=headers, json=consent_data
        ) as response:
            if response.status == 201:
                result = await response.json()
                return result["consentId"]
            else:
                error_data = await response.json()
                raise BankingIntegrationError(f"Failed to get consent: {error_data}")

    async def initiate_sca(self, customer_id: str, transaction_data: Dict) -> str:
        """
        Initiate Strong Customer Authentication
        """
        await self._ensure_authenticated()

        sca_data = {
            "scaRedirect": self.redirect_uri,
            "scaOAuth": self.redirect_uri,
            "psuData": {"psuId": customer_id},
            "transactionData": transaction_data,
        }

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
            "X-Request-ID": str(uuid.uuid4()),
            "PSU-ID": customer_id,
        }

        async with self.session.post(
            f"{self.base_url}/v1/sca/initiate", headers=headers, json=sca_data
        ) as response:
            if response.status == 200:
                result = await response.json()
                return result["scaSessionId"]
            else:
                error_data = await response.json()
                raise BankingIntegrationError(f"Failed to initiate SCA: {error_data}")

    async def verify_sca(self, sca_session_id: str, auth_code: str) -> bool:
        """
        Verify SCA authentication code
        """
        await self._ensure_authenticated()

        verification_data = {
            "scaSessionId": sca_session_id,
            "authenticationCode": auth_code,
        }

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
            "X-Request-ID": str(uuid.uuid4()),
        }

        async with self.session.post(
            f"{self.base_url}/v1/sca/verify", headers=headers, json=verification_data
        ) as response:
            return response.status == 200

    async def get_accounts(self, consent_id: str) -> List[BankAccount]:
        """
        Retrieve accounts using Open Banking AIS
        """
        await self._ensure_authenticated()

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Consent-ID": consent_id,
            "X-Request-ID": str(uuid.uuid4()),
        }

        async with self.session.get(
            f"{self.base_url}/v1/accounts", headers=headers
        ) as response:
            if response.status == 200:
                result = await response.json()
                accounts = []

                for account_data in result["accounts"]:
                    account = BankAccount(
                        account_id=account_data["resourceId"],
                        account_number=account_data.get("maskedPan", ""),
                        routing_number=account_data.get("bic", ""),
                        account_type=account_data.get("cashAccountType", "CACC"),
                        bank_name=account_data.get("name", ""),
                        currency=account_data.get("currency", "EUR"),
                        iban=account_data.get("iban"),
                        swift_code=account_data.get("bic"),
                    )
                    accounts.append(account)

                return accounts
            else:
                error_data = await response.json()
                raise BankingIntegrationError(f"Failed to get accounts: {error_data}")

    async def get_account_balance(
        self, consent_id: str, account_id: str
    ) -> Dict[str, float]:
        """
        Get account balance using Open Banking AIS
        """
        await self._ensure_authenticated()

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Consent-ID": consent_id,
            "X-Request-ID": str(uuid.uuid4()),
        }

        async with self.session.get(
            f"{self.base_url}/v1/accounts/{account_id}/balances", headers=headers
        ) as response:
            if response.status == 200:
                result = await response.json()
                balances = result["balances"]

                current_balance = None
                available_balance = None

                for balance in balances:
                    if balance["balanceType"] == "closingBooked":
                        current_balance = float(balance["balanceAmount"]["amount"])
                    elif balance["balanceType"] == "interimAvailable":
                        available_balance = float(balance["balanceAmount"]["amount"])

                return {
                    "balance": current_balance or 0.0,
                    "available_balance": available_balance or current_balance or 0.0,
                }
            else:
                error_data = await response.json()
                raise BankingIntegrationError(f"Failed to get balance: {error_data}")

    async def get_transactions(
        self,
        consent_id: str,
        account_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: Optional[int] = None,
    ) -> List[Transaction]:
        """
        Retrieve transaction history using Open Banking AIS
        """
        await self._ensure_authenticated()

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Consent-ID": consent_id,
            "X-Request-ID": str(uuid.uuid4()),
        }

        params = {}
        if start_date:
            params["dateFrom"] = start_date.strftime("%Y-%m-%d")
        if end_date:
            params["dateTo"] = end_date.strftime("%Y-%m-%d")

        async with self.session.get(
            f"{self.base_url}/v1/accounts/{account_id}/transactions",
            headers=headers,
            params=params,
        ) as response:
            if response.status == 200:
                result = await response.json()
                transactions = []

                for txn_data in result["transactions"]["booked"]:
                    amount = float(txn_data["transactionAmount"]["amount"])
                    txn_type = (
                        TransactionType.CREDIT if amount > 0 else TransactionType.DEBIT
                    )

                    transaction = Transaction(
                        transaction_id=txn_data.get("transactionId", str(uuid.uuid4())),
                        account_id=account_id,
                        amount=abs(amount),
                        currency=txn_data["transactionAmount"]["currency"],
                        transaction_type=txn_type,
                        status=TransactionStatus.COMPLETED,
                        description=txn_data.get(
                            "remittanceInformationUnstructured", ""
                        ),
                        timestamp=datetime.fromisoformat(txn_data["bookingDate"]),
                        counterparty_name=txn_data.get("creditorName")
                        or txn_data.get("debtorName"),
                        counterparty_account=txn_data.get("creditorAccount", {}).get(
                            "iban"
                        )
                        or txn_data.get("debtorAccount", {}).get("iban"),
                        reference_id=txn_data.get("endToEndId"),
                        metadata={
                            "bankTransactionCode": txn_data.get("bankTransactionCode"),
                            "proprietaryBankTransactionCode": txn_data.get(
                                "proprietaryBankTransactionCode"
                            ),
                        },
                    )
                    transactions.append(transaction)

                return transactions
            else:
                error_data = await response.json()
                raise BankingIntegrationError(
                    f"Failed to get transactions: {error_data}"
                )

    async def get_account_information(
        self, consent_id: str, account_id: str
    ) -> Dict[str, Any]:
        """
        Get comprehensive account information using Open Banking AIS
        """
        await self._ensure_authenticated()

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Consent-ID": consent_id,
            "X-Request-ID": str(uuid.uuid4()),
        }

        async with self.session.get(
            f"{self.base_url}/v1/accounts/{account_id}", headers=headers
        ) as response:
            if response.status == 200:
                return await response.json()
            else:
                error_data = await response.json()
                raise BankingIntegrationError(
                    f"Failed to get account information: {error_data}"
                )

    async def initiate_payment_pis(
        self, consent_id: str, payment_request: PaymentRequest
    ) -> str:
        """
        Initiate payment using Open Banking PIS
        """
        await self._ensure_authenticated()

        payment_data = {
            "instructedAmount": {
                "currency": payment_request.currency,
                "amount": str(payment_request.amount),
            },
            "debtorAccount": {"iban": payment_request.from_account},
            "creditorAccount": {"iban": payment_request.to_account},
            "remittanceInformationUnstructured": payment_request.description,
            "endToEndIdentification": payment_request.reference_id
            or self.generate_reference_id(),
        }

        if payment_request.scheduled_date:
            payment_data["requestedExecutionDate"] = (
                payment_request.scheduled_date.strftime("%Y-%m-%d")
            )

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
            "Consent-ID": consent_id,
            "X-Request-ID": str(uuid.uuid4()),
        }

        async with self.session.post(
            f"{self.base_url}/v1/payments/sepa-credit-transfers",
            headers=headers,
            json=payment_data,
        ) as response:
            if response.status == 201:
                result = await response.json()
                return result["paymentId"]
            else:
                error_data = await response.json()
                raise BankingIntegrationError(
                    f"Failed to initiate payment: {error_data}"
                )

    async def initiate_payment(self, payment_request: PaymentRequest) -> str:
        """
        Initiate payment (requires consent)
        """
        # This method requires a valid consent ID
        # In practice, you would get this from the payment request metadata
        consent_id = (
            payment_request.metadata.get("consent_id")
            if payment_request.metadata
            else None
        )
        if not consent_id:
            raise BankingIntegrationError(
                "Consent ID required for Open Banking payments"
            )

        return await self.initiate_payment_pis(consent_id, payment_request)

    async def get_payment_status(
        self, payment_id: str, consent_id: str = None
    ) -> TransactionStatus:
        """
        Get payment status using Open Banking PIS
        """
        await self._ensure_authenticated()

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "X-Request-ID": str(uuid.uuid4()),
        }

        if consent_id:
            headers["Consent-ID"] = consent_id

        async with self.session.get(
            f"{self.base_url}/v1/payments/sepa-credit-transfers/{payment_id}/status",
            headers=headers,
        ) as response:
            if response.status == 200:
                result = await response.json()
                status_mapping = {
                    "RCVD": TransactionStatus.PENDING,
                    "PDNG": TransactionStatus.PROCESSING,
                    "ACTC": TransactionStatus.COMPLETED,
                    "RJCT": TransactionStatus.FAILED,
                    "CANC": TransactionStatus.CANCELLED,
                }
                return status_mapping.get(
                    result["transactionStatus"], TransactionStatus.PENDING
                )
            else:
                error_data = await response.json()
                raise BankingIntegrationError(
                    f"Failed to get payment status: {error_data}"
                )

    async def cancel_payment(self, payment_id: str, consent_id: str = None) -> bool:
        """
        Cancel payment using Open Banking PIS
        """
        await self._ensure_authenticated()

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "X-Request-ID": str(uuid.uuid4()),
        }

        if consent_id:
            headers["Consent-ID"] = consent_id

        async with self.session.delete(
            f"{self.base_url}/v1/payments/sepa-credit-transfers/{payment_id}",
            headers=headers,
        ) as response:
            return response.status == 204

    async def close(self):
        """Close the HTTP session"""
        if self.session:
            await self.session.close()

    def __del__(self):
        """Cleanup on deletion"""
        if self.session and not self.session.closed:
            asyncio.create_task(self.session.close())

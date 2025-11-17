# Multi-Currency Support with Real-time Exchange Rates
import json
from datetime import datetime, timedelta
from decimal import ROUND_HALF_UP, Decimal
from typing import Any, Dict, List, Optional

import redis
import requests
from flask import Blueprint, jsonify, request
from sqlalchemy import and_, or_
from src.models.enhanced_database import Transaction, Wallet
from src.security.audit_logger import AuditLogger
from src.security.input_validator import InputValidator, ValidationError
from src.security.rate_limiter import rate_limit
from src.security.token_manager import (enhanced_token_required,
                                        require_permissions)

multicurrency_bp = Blueprint("multicurrency", __name__)


class ExchangeRateManager:
    """Real-time exchange rate management system"""

    def __init__(self):
        self.redis_client = redis.Redis.from_url(
            "redis://localhost:6379", decode_responses=True
        )
        self.supported_currencies = [
            "USD",
            "EUR",
            "GBP",
            "JPY",
            "CAD",
            "AUD",
            "CHF",
            "CNY",
            "SEK",
            "NZD",
            "MXN",
            "SGD",
            "HKD",
            "NOK",
            "TRY",
            "ZAR",
            "BRL",
            "INR",
            "KRW",
            "PLN",
        ]
        self.base_currency = "USD"
        self.rate_cache_ttl = 300  # 5 minutes

    def get_exchange_rate(self, from_currency: str, to_currency: str) -> Decimal:
        """Get real-time exchange rate between two currencies"""
        if from_currency == to_currency:
            return Decimal("1.0")

        # Check cache first
        cache_key = f"exchange_rate:{from_currency}:{to_currency}"
        cached_rate = self.redis_client.get(cache_key)

        if cached_rate:
            return Decimal(cached_rate)

        # Fetch from external API
        rate = self._fetch_exchange_rate(from_currency, to_currency)

        # Cache the rate
        self.redis_client.setex(cache_key, self.rate_cache_ttl, str(rate))

        return rate

    def _fetch_exchange_rate(self, from_currency: str, to_currency: str) -> Decimal:
        """Fetch exchange rate from external API"""
        try:
            # Using a mock exchange rate API (in production, use real APIs like Fixer.io, CurrencyAPI, etc.)
            # For demonstration, using hardcoded rates
            mock_rates = {
                "USD": {"EUR": 0.85, "GBP": 0.73, "JPY": 110.0, "CAD": 1.25},
                "EUR": {"USD": 1.18, "GBP": 0.86, "JPY": 129.0, "CAD": 1.47},
                "GBP": {"USD": 1.37, "EUR": 1.16, "JPY": 150.0, "CAD": 1.71},
                "JPY": {"USD": 0.0091, "EUR": 0.0077, "GBP": 0.0067, "CAD": 0.011},
            }

            if from_currency in mock_rates and to_currency in mock_rates[from_currency]:
                return Decimal(str(mock_rates[from_currency][to_currency]))

            # If direct rate not available, calculate via USD
            if from_currency != "USD" and to_currency != "USD":
                usd_from_rate = self._fetch_exchange_rate(from_currency, "USD")
                usd_to_rate = self._fetch_exchange_rate("USD", to_currency)
                return usd_from_rate * usd_to_rate

            # Default fallback rate
            return Decimal("1.0")

        except Exception as e:
            # Log error and return fallback rate
            print(f"Error fetching exchange rate: {e}")
            return Decimal("1.0")

    def convert_amount(
        self, amount: Decimal, from_currency: str, to_currency: str
    ) -> Dict[str, Any]:
        """Convert amount between currencies"""
        if from_currency == to_currency:
            return {
                "original_amount": str(amount),
                "original_currency": from_currency,
                "converted_amount": str(amount),
                "converted_currency": to_currency,
                "exchange_rate": "1.0",
                "conversion_fee": "0.0",
                "total_cost": str(amount),
                "timestamp": datetime.utcnow().isoformat(),
            }

        # Get exchange rate
        exchange_rate = self.get_exchange_rate(from_currency, to_currency)

        # Calculate converted amount
        converted_amount = amount * exchange_rate

        # Calculate conversion fee (0.5% of original amount)
        conversion_fee_rate = Decimal("0.005")
        conversion_fee = amount * conversion_fee_rate

        # Round to appropriate decimal places
        if to_currency in ["JPY", "KRW"]:  # Currencies without decimal places
            converted_amount = converted_amount.quantize(
                Decimal("1"), rounding=ROUND_HALF_UP
            )
        else:
            converted_amount = converted_amount.quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )

        conversion_fee = conversion_fee.quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        total_cost = amount + conversion_fee

        return {
            "original_amount": str(amount),
            "original_currency": from_currency,
            "converted_amount": str(converted_amount),
            "converted_currency": to_currency,
            "exchange_rate": str(exchange_rate),
            "conversion_fee": str(conversion_fee),
            "conversion_fee_rate": str(conversion_fee_rate),
            "total_cost": str(total_cost),
            "timestamp": datetime.utcnow().isoformat(),
        }

    def get_all_rates(self, base_currency: str = "USD") -> Dict[str, str]:
        """Get all exchange rates for a base currency"""
        rates = {}

        for currency in self.supported_currencies:
            if currency != base_currency:
                rate = self.get_exchange_rate(base_currency, currency)
                rates[currency] = str(rate)

        return rates


class MultiCurrencyWalletManager:
    """Multi-currency wallet management system"""

    def __init__(self):
        self.exchange_manager = ExchangeRateManager()

    def create_currency_wallet(self, user_id: str, currency: str) -> Dict[str, Any]:
        """Create a new currency wallet for user"""
        from src.models.enhanced_database import Wallet, db

        # Check if wallet already exists
        existing_wallet = (
            db.session.query(Wallet)
            .filter(Wallet.user_id == user_id)
            .filter(Wallet.currency == currency)
            .first()
        )

        if existing_wallet:
            raise ValueError(f"Wallet for {currency} already exists")

        # Create new wallet
        new_wallet = Wallet(
            user_id=user_id,
            wallet_type="user",
            currency=currency,
            balance=Decimal("0.00"),
            available_balance=Decimal("0.00"),
            pending_balance=Decimal("0.00"),
            status="active",
        )

        db.session.add(new_wallet)
        db.session.commit()

        return {
            "wallet_id": new_wallet.id,
            "currency": currency,
            "balance": str(new_wallet.balance),
            "status": new_wallet.status,
            "created_at": new_wallet.created_at.isoformat(),
        }

    def get_user_wallets(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all wallets for a user with current balances"""
        from src.models.enhanced_database import Wallet, db

        wallets = (
            db.session.query(Wallet)
            .filter(Wallet.user_id == user_id)
            .filter(Wallet.status == "active")
            .all()
        )

        wallet_list = []
        total_usd_value = Decimal("0.00")

        for wallet in wallets:
            # Convert balance to USD for total calculation
            if wallet.currency != "USD":
                usd_rate = self.exchange_manager.get_exchange_rate(
                    wallet.currency, "USD"
                )
                usd_value = wallet.balance * usd_rate
            else:
                usd_value = wallet.balance

            total_usd_value += usd_value

            wallet_data = {
                "wallet_id": wallet.id,
                "currency": wallet.currency,
                "balance": str(wallet.balance),
                "available_balance": str(wallet.available_balance),
                "pending_balance": str(wallet.pending_balance),
                "usd_value": str(usd_value.quantize(Decimal("0.01"))),
                "status": wallet.status,
                "last_transaction_at": (
                    wallet.last_transaction_at.isoformat()
                    if wallet.last_transaction_at
                    else None
                ),
            }

            wallet_list.append(wallet_data)

        return {
            "wallets": wallet_list,
            "total_wallets": len(wallet_list),
            "total_usd_value": str(total_usd_value.quantize(Decimal("0.01"))),
            "supported_currencies": self.exchange_manager.supported_currencies,
        }

    def transfer_between_currencies(
        self, user_id: str, from_currency: str, to_currency: str, amount: Decimal
    ) -> Dict[str, Any]:
        """Transfer funds between different currency wallets"""
        from src.models.enhanced_database import Transaction, Wallet, db

        # Get source and destination wallets
        source_wallet = (
            db.session.query(Wallet)
            .filter(Wallet.user_id == user_id)
            .filter(Wallet.currency == from_currency)
            .filter(Wallet.status == "active")
            .first()
        )

        if not source_wallet:
            raise ValueError(f"Source wallet for {from_currency} not found")

        dest_wallet = (
            db.session.query(Wallet)
            .filter(Wallet.user_id == user_id)
            .filter(Wallet.currency == to_currency)
            .filter(Wallet.status == "active")
            .first()
        )

        if not dest_wallet:
            # Create destination wallet if it doesn't exist
            dest_wallet_data = self.create_currency_wallet(user_id, to_currency)
            dest_wallet = db.session.query(Wallet).get(dest_wallet_data["wallet_id"])

        # Check sufficient balance
        if source_wallet.available_balance < amount:
            raise ValueError("Insufficient balance")

        # Get conversion details
        conversion = self.exchange_manager.convert_amount(
            amount, from_currency, to_currency
        )
        converted_amount = Decimal(conversion["converted_amount"])
        conversion_fee = Decimal(conversion["conversion_fee"])

        try:
            # Start database transaction
            db.session.begin()

            # Debit source wallet
            source_wallet.balance -= amount
            source_wallet.available_balance -= amount
            source_wallet.last_transaction_at = datetime.utcnow()

            # Credit destination wallet
            dest_wallet.balance += converted_amount
            dest_wallet.available_balance += converted_amount
            dest_wallet.last_transaction_at = datetime.utcnow()

            # Create debit transaction
            debit_transaction = Transaction(
                wallet_id=source_wallet.id,
                transaction_type="debit",
                amount=amount,
                currency=from_currency,
                description=f"Currency conversion to {to_currency}",
                status="completed",
                balance_before=source_wallet.balance + amount,
                balance_after=source_wallet.balance,
                processed_at=datetime.utcnow(),
            )

            # Create credit transaction
            credit_transaction = Transaction(
                wallet_id=dest_wallet.id,
                transaction_type="credit",
                amount=converted_amount,
                currency=to_currency,
                description=f"Currency conversion from {from_currency}",
                status="completed",
                balance_before=dest_wallet.balance - converted_amount,
                balance_after=dest_wallet.balance,
                processed_at=datetime.utcnow(),
            )

            db.session.add(debit_transaction)
            db.session.add(credit_transaction)
            db.session.commit()

            return {
                "transfer_id": debit_transaction.id,
                "source_transaction_id": debit_transaction.id,
                "destination_transaction_id": credit_transaction.id,
                "conversion_details": conversion,
                "source_wallet": {
                    "currency": from_currency,
                    "amount_debited": str(amount),
                    "new_balance": str(source_wallet.balance),
                },
                "destination_wallet": {
                    "currency": to_currency,
                    "amount_credited": str(converted_amount),
                    "new_balance": str(dest_wallet.balance),
                },
                "completed_at": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            db.session.rollback()
            raise e


@multicurrency_bp.route("/currencies/supported", methods=["GET"])
@enhanced_token_required
@rate_limit("100 per hour")
def get_supported_currencies():
    """Get list of supported currencies"""
    try:
        exchange_manager = ExchangeRateManager()

        return (
            jsonify(
                {
                    "supported_currencies": exchange_manager.supported_currencies,
                    "base_currency": exchange_manager.base_currency,
                    "total_currencies": len(exchange_manager.supported_currencies),
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"error": str(e), "code": "FETCH_ERROR"}), 500


@multicurrency_bp.route("/exchange-rates", methods=["GET"])
@enhanced_token_required
@rate_limit("200 per hour")
def get_exchange_rates():
    """Get current exchange rates"""
    try:
        base_currency = request.args.get("base", "USD")

        if base_currency not in ExchangeRateManager().supported_currencies:
            return (
                jsonify(
                    {"error": "Unsupported base currency", "code": "INVALID_CURRENCY"}
                ),
                400,
            )

        exchange_manager = ExchangeRateManager()
        rates = exchange_manager.get_all_rates(base_currency)

        return (
            jsonify(
                {
                    "base_currency": base_currency,
                    "rates": rates,
                    "timestamp": datetime.utcnow().isoformat(),
                    "cache_ttl": exchange_manager.rate_cache_ttl,
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"error": str(e), "code": "RATES_ERROR"}), 500


@multicurrency_bp.route("/convert", methods=["POST"])
@enhanced_token_required
@rate_limit("100 per hour")
def convert_currency():
    """Convert amount between currencies"""
    try:
        data = request.get_json()

        # Validate input
        schema = {
            "amount": {
                "type": "decimal",
                "required": True,
                "min_value": Decimal("0.01"),
            },
            "from_currency": {"type": "currency", "required": True},
            "to_currency": {"type": "currency", "required": True},
        }

        validated_data = InputValidator.validate_json_schema(data, schema)

        # Perform conversion
        exchange_manager = ExchangeRateManager()
        conversion_result = exchange_manager.convert_amount(
            validated_data["amount"],
            validated_data["from_currency"],
            validated_data["to_currency"],
        )

        # Log conversion
        AuditLogger.log_event(
            user_id=request.current_user["user_id"],
            action="currency_conversion_quote",
            resource_type="currency_conversion",
            additional_data=conversion_result,
        )

        return jsonify(conversion_result), 200

    except ValidationError as e:
        return jsonify({"error": str(e), "code": "VALIDATION_ERROR"}), 400
    except Exception as e:
        return jsonify({"error": str(e), "code": "CONVERSION_ERROR"}), 500


@multicurrency_bp.route("/wallets", methods=["GET"])
@enhanced_token_required
@rate_limit("100 per hour")
def get_user_wallets():
    """Get all wallets for current user"""
    try:
        user_id = request.current_user["user_id"]

        wallet_manager = MultiCurrencyWalletManager()
        wallets_data = wallet_manager.get_user_wallets(user_id)

        return jsonify(wallets_data), 200

    except Exception as e:
        return jsonify({"error": str(e), "code": "FETCH_ERROR"}), 500


@multicurrency_bp.route("/wallets", methods=["POST"])
@enhanced_token_required
@rate_limit("20 per hour")
def create_wallet():
    """Create new currency wallet"""
    try:
        data = request.get_json()
        user_id = request.current_user["user_id"]

        # Validate input
        schema = {"currency": {"type": "currency", "required": True}}

        validated_data = InputValidator.validate_json_schema(data, schema)

        # Create wallet
        wallet_manager = MultiCurrencyWalletManager()
        wallet_data = wallet_manager.create_currency_wallet(
            user_id, validated_data["currency"]
        )

        # Log wallet creation
        AuditLogger.log_event(
            user_id=user_id,
            action="create_currency_wallet",
            resource_type="wallet",
            resource_id=wallet_data["wallet_id"],
            additional_data={"currency": validated_data["currency"]},
        )

        return (
            jsonify(
                {
                    "wallet": wallet_data,
                    "message": f"{validated_data['currency']} wallet created successfully",
                }
            ),
            201,
        )

    except ValidationError as e:
        return jsonify({"error": str(e), "code": "VALIDATION_ERROR"}), 400
    except ValueError as e:
        return jsonify({"error": str(e), "code": "WALLET_EXISTS"}), 409
    except Exception as e:
        return jsonify({"error": str(e), "code": "CREATION_ERROR"}), 500


@multicurrency_bp.route("/transfer/currency", methods=["POST"])
@enhanced_token_required
@rate_limit("50 per hour")
def transfer_between_currencies():
    """Transfer funds between different currency wallets"""
    try:
        data = request.get_json()
        user_id = request.current_user["user_id"]

        # Validate input
        schema = {
            "from_currency": {"type": "currency", "required": True},
            "to_currency": {"type": "currency", "required": True},
            "amount": {
                "type": "decimal",
                "required": True,
                "min_value": Decimal("0.01"),
            },
        }

        validated_data = InputValidator.validate_json_schema(data, schema)

        if validated_data["from_currency"] == validated_data["to_currency"]:
            return (
                jsonify(
                    {
                        "error": "Source and destination currencies must be different",
                        "code": "SAME_CURRENCY",
                    }
                ),
                400,
            )

        # Perform transfer
        wallet_manager = MultiCurrencyWalletManager()
        transfer_result = wallet_manager.transfer_between_currencies(
            user_id,
            validated_data["from_currency"],
            validated_data["to_currency"],
            validated_data["amount"],
        )

        # Log transfer
        AuditLogger.log_financial_transaction(
            user_id=user_id,
            transaction_id=transfer_result["transfer_id"],
            transaction_type="currency_conversion",
            amount=str(validated_data["amount"]),
            currency=validated_data["from_currency"],
            status="completed",
            additional_context={
                "to_currency": validated_data["to_currency"],
                "converted_amount": transfer_result["destination_wallet"][
                    "amount_credited"
                ],
                "exchange_rate": transfer_result["conversion_details"]["exchange_rate"],
            },
        )

        return (
            jsonify(
                {
                    "transfer": transfer_result,
                    "message": "Currency transfer completed successfully",
                }
            ),
            200,
        )

    except ValidationError as e:
        return jsonify({"error": str(e), "code": "VALIDATION_ERROR"}), 400
    except ValueError as e:
        return jsonify({"error": str(e), "code": "TRANSFER_ERROR"}), 400
    except Exception as e:
        return jsonify({"error": str(e), "code": "PROCESSING_ERROR"}), 500

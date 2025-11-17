import json
import logging
import os
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import ROUND_HALF_UP, Decimal
from typing import Dict, List, Optional, Tuple

import redis
import requests
from flask import current_app

logger = logging.getLogger(__name__)


@dataclass
class ExchangeRate:
    """Exchange rate data structure"""

    from_currency: str
    to_currency: str
    rate: Decimal
    timestamp: datetime
    provider: str
    bid: Optional[Decimal] = None
    ask: Optional[Decimal] = None


class CurrencyExchangeService:
    """
    Enhanced Currency Exchange Service implementing financial industry standards
    Provides real-time exchange rates, conversion, and multi-currency support
    """

    SUPPORTED_CURRENCIES = [
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

    # Major currency pairs for better rates
    MAJOR_PAIRS = [
        ("USD", "EUR"),
        ("USD", "GBP"),
        ("USD", "JPY"),
        ("USD", "CHF"),
        ("EUR", "GBP"),
        ("EUR", "JPY"),
        ("GBP", "JPY"),
        ("AUD", "USD"),
        ("USD", "CAD"),
        ("NZD", "USD"),
    ]

    def __init__(self):
        self.api_key = os.environ.get("EXCHANGE_RATE_API_KEY")
        self.backup_api_key = os.environ.get("BACKUP_EXCHANGE_RATE_API_KEY")
        self.cache_ttl = int(
            os.environ.get("EXCHANGE_RATE_CACHE_TTL", "300")
        )  # 5 minutes

        # Initialize Redis for caching
        try:
            self.redis_client = redis.Redis.from_url(
                os.environ.get("REDIS_URL", "redis://localhost:6379"),
                decode_responses=True,
            )
            self.redis_client.ping()
        except Exception:
            self.redis_client = None
            logger.warning("Redis not available for exchange rate caching")

        # Exchange rate providers
        self.providers = {
            "exchangerate_api": {
                "url": "https://v6.exchangerate-api.com/v6/{api_key}/latest/{base}",
                "backup_url": "https://v6.exchangerate-api.com/v6/{api_key}/pair/{from_curr}/{to_curr}",
            },
            "fixer": {
                "url": "http://data.fixer.io/api/latest?access_key={api_key}&base={base}&symbols={symbols}"
            },
            "currencylayer": {
                "url": "http://api.currencylayer.com/live?access_key={api_key}&source={base}&currencies={symbols}"
            },
        }

    def get_exchange_rate(
        self, from_currency: str, to_currency: str, provider: str = "exchangerate_api"
    ) -> Optional[ExchangeRate]:
        """
        Get exchange rate between two currencies

        Args:
            from_currency: Source currency code
            to_currency: Target currency code
            provider: Exchange rate provider

        Returns:
            ExchangeRate object or None if not available
        """
        try:
            # Validate currencies
            if from_currency not in self.SUPPORTED_CURRENCIES:
                logger.error(f"Unsupported source currency: {from_currency}")
                return None

            if to_currency not in self.SUPPORTED_CURRENCIES:
                logger.error(f"Unsupported target currency: {to_currency}")
                return None

            # Same currency
            if from_currency == to_currency:
                return ExchangeRate(
                    from_currency=from_currency,
                    to_currency=to_currency,
                    rate=Decimal("1.0"),
                    timestamp=datetime.now(timezone.utc),
                    provider="internal",
                )

            # Check cache first
            cached_rate = self._get_cached_rate(from_currency, to_currency)
            if cached_rate:
                return cached_rate

            # Fetch from provider
            rate = self._fetch_rate_from_provider(from_currency, to_currency, provider)

            if rate:
                # Cache the rate
                self._cache_rate(rate)
                return rate

            # Try backup provider if primary fails
            if provider != "fixer":
                logger.warning(
                    f"Primary provider failed, trying backup for {from_currency}/{to_currency}"
                )
                backup_rate = self._fetch_rate_from_provider(
                    from_currency, to_currency, "fixer"
                )
                if backup_rate:
                    self._cache_rate(backup_rate)
                    return backup_rate

            logger.error(
                f"Failed to get exchange rate for {from_currency}/{to_currency}"
            )
            return None

        except Exception as e:
            logger.error(f"Error getting exchange rate: {str(e)}")
            return None

    def _get_cached_rate(
        self, from_currency: str, to_currency: str
    ) -> Optional[ExchangeRate]:
        """Get cached exchange rate"""
        if not self.redis_client:
            return None

        try:
            cache_key = f"exchange_rate:{from_currency}:{to_currency}"
            cached_data = self.redis_client.get(cache_key)

            if cached_data:
                data = json.loads(cached_data)
                return ExchangeRate(
                    from_currency=data["from_currency"],
                    to_currency=data["to_currency"],
                    rate=Decimal(data["rate"]),
                    timestamp=datetime.fromisoformat(data["timestamp"]),
                    provider=data["provider"],
                    bid=Decimal(data["bid"]) if data.get("bid") else None,
                    ask=Decimal(data["ask"]) if data.get("ask") else None,
                )

        except Exception as e:
            logger.error(f"Error getting cached rate: {str(e)}")

        return None

    def _cache_rate(self, rate: ExchangeRate):
        """Cache exchange rate"""
        if not self.redis_client:
            return

        try:
            cache_key = f"exchange_rate:{rate.from_currency}:{rate.to_currency}"
            cache_data = {
                "from_currency": rate.from_currency,
                "to_currency": rate.to_currency,
                "rate": str(rate.rate),
                "timestamp": rate.timestamp.isoformat(),
                "provider": rate.provider,
                "bid": str(rate.bid) if rate.bid else None,
                "ask": str(rate.ask) if rate.ask else None,
            }

            self.redis_client.setex(cache_key, self.cache_ttl, json.dumps(cache_data))

        except Exception as e:
            logger.error(f"Error caching rate: {str(e)}")

    def _fetch_rate_from_provider(
        self, from_currency: str, to_currency: str, provider: str
    ) -> Optional[ExchangeRate]:
        """Fetch exchange rate from external provider"""
        try:
            if provider == "exchangerate_api":
                return self._fetch_from_exchangerate_api(from_currency, to_currency)
            elif provider == "fixer":
                return self._fetch_from_fixer(from_currency, to_currency)
            elif provider == "currencylayer":
                return self._fetch_from_currencylayer(from_currency, to_currency)
            else:
                logger.error(f"Unknown provider: {provider}")
                return None

        except Exception as e:
            logger.error(f"Error fetching from provider {provider}: {str(e)}")
            return None

    def _fetch_from_exchangerate_api(
        self, from_currency: str, to_currency: str
    ) -> Optional[ExchangeRate]:
        """Fetch rate from ExchangeRate-API"""
        try:
            if not self.api_key:
                logger.error("ExchangeRate-API key not configured")
                return None

            url = self.providers["exchangerate_api"]["url"].format(
                api_key=self.api_key, base=from_currency
            )

            response = requests.get(url, timeout=10)
            response.raise_for_status()

            data = response.json()

            if data.get("result") == "success" and to_currency in data.get(
                "conversion_rates", {}
            ):
                rate = Decimal(str(data["conversion_rates"][to_currency]))

                return ExchangeRate(
                    from_currency=from_currency,
                    to_currency=to_currency,
                    rate=rate,
                    timestamp=datetime.now(timezone.utc),
                    provider="exchangerate_api",
                )

        except Exception as e:
            logger.error(f"Error fetching from ExchangeRate-API: {str(e)}")

        return None

    def _fetch_from_fixer(
        self, from_currency: str, to_currency: str
    ) -> Optional[ExchangeRate]:
        """Fetch rate from Fixer.io"""
        try:
            if not self.backup_api_key:
                logger.error("Fixer.io API key not configured")
                return None

            url = self.providers["fixer"]["url"].format(
                api_key=self.backup_api_key, base=from_currency, symbols=to_currency
            )

            response = requests.get(url, timeout=10)
            response.raise_for_status()

            data = response.json()

            if data.get("success") and to_currency in data.get("rates", {}):
                rate = Decimal(str(data["rates"][to_currency]))

                return ExchangeRate(
                    from_currency=from_currency,
                    to_currency=to_currency,
                    rate=rate,
                    timestamp=datetime.now(timezone.utc),
                    provider="fixer",
                )

        except Exception as e:
            logger.error(f"Error fetching from Fixer.io: {str(e)}")

        return None

    def _fetch_from_currencylayer(
        self, from_currency: str, to_currency: str
    ) -> Optional[ExchangeRate]:
        """Fetch rate from CurrencyLayer"""
        try:
            # CurrencyLayer implementation would go here
            # For now, return None as it requires different API structure
            return None

        except Exception as e:
            logger.error(f"Error fetching from CurrencyLayer: {str(e)}")
            return None

    def convert_currency(
        self,
        amount: Decimal,
        from_currency: str,
        to_currency: str,
        rate: Optional[Decimal] = None,
    ) -> Optional[Decimal]:
        """
        Convert amount from one currency to another

        Args:
            amount: Amount to convert
            from_currency: Source currency
            to_currency: Target currency
            rate: Optional exchange rate (if not provided, will be fetched)

        Returns:
            Converted amount or None if conversion fails
        """
        try:
            if from_currency == to_currency:
                return amount

            # Get exchange rate if not provided
            if rate is None:
                exchange_rate = self.get_exchange_rate(from_currency, to_currency)
                if not exchange_rate:
                    return None
                rate = exchange_rate.rate

            # Perform conversion with proper rounding
            converted_amount = (amount * rate).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )

            logger.info(
                f"Converted {amount} {from_currency} to {converted_amount} {to_currency} at rate {rate}"
            )
            return converted_amount

        except Exception as e:
            logger.error(f"Error converting currency: {str(e)}")
            return None

    def get_supported_currencies(self) -> List[str]:
        """Get list of supported currencies"""
        return self.SUPPORTED_CURRENCIES.copy()

    def get_currency_info(self, currency_code: str) -> Optional[Dict]:
        """
        Get detailed information about a currency

        Args:
            currency_code: ISO currency code

        Returns:
            Dictionary with currency information
        """
        currency_info = {
            "USD": {"name": "US Dollar", "symbol": "$", "decimal_places": 2},
            "EUR": {"name": "Euro", "symbol": "€", "decimal_places": 2},
            "GBP": {"name": "British Pound", "symbol": "£", "decimal_places": 2},
            "JPY": {"name": "Japanese Yen", "symbol": "¥", "decimal_places": 0},
            "CAD": {"name": "Canadian Dollar", "symbol": "C$", "decimal_places": 2},
            "AUD": {"name": "Australian Dollar", "symbol": "A$", "decimal_places": 2},
            "CHF": {"name": "Swiss Franc", "symbol": "CHF", "decimal_places": 2},
            "CNY": {"name": "Chinese Yuan", "symbol": "¥", "decimal_places": 2},
            "SEK": {"name": "Swedish Krona", "symbol": "kr", "decimal_places": 2},
            "NZD": {"name": "New Zealand Dollar", "symbol": "NZ$", "decimal_places": 2},
            "MXN": {"name": "Mexican Peso", "symbol": "$", "decimal_places": 2},
            "SGD": {"name": "Singapore Dollar", "symbol": "S$", "decimal_places": 2},
            "HKD": {"name": "Hong Kong Dollar", "symbol": "HK$", "decimal_places": 2},
            "NOK": {"name": "Norwegian Krone", "symbol": "kr", "decimal_places": 2},
            "TRY": {"name": "Turkish Lira", "symbol": "₺", "decimal_places": 2},
            "ZAR": {"name": "South African Rand", "symbol": "R", "decimal_places": 2},
            "BRL": {"name": "Brazilian Real", "symbol": "R$", "decimal_places": 2},
            "INR": {"name": "Indian Rupee", "symbol": "₹", "decimal_places": 2},
            "KRW": {"name": "South Korean Won", "symbol": "₩", "decimal_places": 0},
            "PLN": {"name": "Polish Zloty", "symbol": "zł", "decimal_places": 2},
        }

        return currency_info.get(currency_code.upper())

    def get_historical_rates(
        self,
        from_currency: str,
        to_currency: str,
        start_date: datetime,
        end_date: datetime,
    ) -> List[ExchangeRate]:
        """
        Get historical exchange rates for a date range

        Args:
            from_currency: Source currency
            to_currency: Target currency
            start_date: Start date
            end_date: End date

        Returns:
            List of historical exchange rates
        """
        # This would require a different API endpoint for historical data
        # For now, return empty list as it's not implemented
        logger.warning("Historical rates not implemented yet")
        return []

    def calculate_cross_rate(
        self, currency_a: str, currency_b: str, base_currency: str = "USD"
    ) -> Optional[Decimal]:
        """
        Calculate cross rate between two currencies using a base currency

        Args:
            currency_a: First currency
            currency_b: Second currency
            base_currency: Base currency for calculation

        Returns:
            Cross rate or None if calculation fails
        """
        try:
            # Get rates to base currency
            rate_a = self.get_exchange_rate(base_currency, currency_a)
            rate_b = self.get_exchange_rate(base_currency, currency_b)

            if not rate_a or not rate_b:
                return None

            # Calculate cross rate
            cross_rate = rate_a.rate / rate_b.rate

            return cross_rate.quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP)

        except Exception as e:
            logger.error(f"Error calculating cross rate: {str(e)}")
            return None


# Global currency exchange service instance
currency_service = CurrencyExchangeService()


# Convenience functions
def get_exchange_rate(from_currency: str, to_currency: str) -> Optional[ExchangeRate]:
    """Get exchange rate between currencies"""
    return currency_service.get_exchange_rate(from_currency, to_currency)


def convert_currency(
    amount: Decimal, from_currency: str, to_currency: str
) -> Optional[Decimal]:
    """Convert amount between currencies"""
    return currency_service.convert_currency(amount, from_currency, to_currency)


def get_supported_currencies() -> List[str]:
    """Get list of supported currencies"""
    return currency_service.get_supported_currencies()


def get_currency_info(currency_code: str) -> Optional[Dict]:
    """Get currency information"""
    return currency_service.get_currency_info(currency_code)

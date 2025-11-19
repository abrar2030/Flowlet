import asyncio
import json
import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import ROUND_HALF_UP, Decimal
from enum import Enum
from typing import Any, Dict, List, Optional

import numpy as np
import redis
from sqlalchemy import Boolean, Column, DateTime, Numeric, String, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

"""
Enhanced Multi-Currency and Exchange Rate Management System
Implements real-time exchange rates, accurate conversion, and FX accounting
"""


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

Base = declarative_base()


class CurrencyCode(Enum):
    """Supported currency codes (ISO 4217)"""

    USD = "USD"
    EUR = "EUR"
    GBP = "GBP"
    JPY = "JPY"
    CAD = "CAD"
    AUD = "AUD"
    CHF = "CHF"
    CNY = "CNY"
    INR = "INR"
    BRL = "BRL"
    MXN = "MXN"
    SGD = "SGD"
    HKD = "HKD"
    NOK = "NOK"
    SEK = "SEK"
    DKK = "DKK"
    PLN = "PLN"
    CZK = "CZK"
    HUF = "HUF"
    RUB = "RUB"


class ExchangeRateProvider(Enum):
    """Exchange rate data providers"""

    FIXER_IO = "fixer_io"
    OPEN_EXCHANGE_RATES = "open_exchange_rates"
    CURRENCY_API = "currency_api"
    ECB = "ecb"  # European Central Bank
    FED = "fed"  # Federal Reserve
    INTERNAL = "internal"


class FXTransactionType(Enum):
    """Foreign exchange transaction types"""

    SPOT = "spot"
    FORWARD = "forward"
    SWAP = "swap"
    CONVERSION = "conversion"
    HEDGE = "hedge"


@dataclass
class ExchangeRate:
    """Exchange rate data structure"""

    base_currency: str
    target_currency: str
    rate: Decimal
    timestamp: datetime
    provider: ExchangeRateProvider
    bid_rate: Optional[Decimal] = None
    ask_rate: Optional[Decimal] = None
    mid_rate: Optional[Decimal] = None
    spread: Optional[Decimal] = None


@dataclass
class CurrencyConversion:
    """Currency conversion result"""

    conversion_id: str
    from_currency: str
    to_currency: str
    from_amount: Decimal
    to_amount: Decimal
    exchange_rate: Decimal
    conversion_fee: Decimal
    net_amount: Decimal
    timestamp: datetime
    rate_provider: ExchangeRateProvider


@dataclass
class FXPosition:
    """Foreign exchange position"""

    currency: str
    amount: Decimal
    base_currency_value: Decimal
    unrealized_pnl: Decimal
    realized_pnl: Decimal
    average_rate: Decimal
    last_updated: datetime


class ExchangeRateModel(Base):
    """Database model for exchange rates"""

    __tablename__ = "exchange_rates"

    id = Column(String, primary_key=True)
    base_currency = Column(String(3), nullable=False)
    target_currency = Column(String(3), nullable=False)
    rate = Column(Numeric(20, 8), nullable=False)
    bid_rate = Column(Numeric(20, 8))
    ask_rate = Column(Numeric(20, 8))
    mid_rate = Column(Numeric(20, 8))
    spread = Column(Numeric(10, 6))
    provider = Column(String(50), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    is_active = Column(Boolean, default=True)


class CurrencyConversionModel(Base):
    """Database model for currency conversions"""

    __tablename__ = "currency_conversions"

    conversion_id = Column(String, primary_key=True)
    from_currency = Column(String(3), nullable=False)
    to_currency = Column(String(3), nullable=False)
    from_amount = Column(Numeric(20, 8), nullable=False)
    to_amount = Column(Numeric(20, 8), nullable=False)
    exchange_rate = Column(Numeric(20, 8), nullable=False)
    conversion_fee = Column(Numeric(20, 8), nullable=False)
    net_amount = Column(Numeric(20, 8), nullable=False)
    rate_provider = Column(String(50), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    user_id = Column(String, nullable=False)
    transaction_id = Column(String)


class FXPositionModel(Base):
    """Database model for FX positions"""

    __tablename__ = "fx_positions"

    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=False)
    currency = Column(String(3), nullable=False)
    amount = Column(Numeric(20, 8), nullable=False)
    base_currency_value = Column(Numeric(20, 8), nullable=False)
    unrealized_pnl = Column(Numeric(20, 8), default=0)
    realized_pnl = Column(Numeric(20, 8), default=0)
    average_rate = Column(Numeric(20, 8), nullable=False)
    last_updated = Column(DateTime(timezone=True), nullable=False)


class ExchangeRateService:
    """
    Real-time exchange rate service with multiple providers
    """

    def __init__(self, database_url: str, redis_url: str = "redis://localhost:6379/9"):
        self.engine = create_engine(database_url)
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)

        self.redis_client = redis.from_url(redis_url)
        self.providers = {
            ExchangeRateProvider.FIXER_IO: self._fetch_fixer_io_rates,
            ExchangeRateProvider.OPEN_EXCHANGE_RATES: self._fetch_oxr_rates,
            ExchangeRateProvider.ECB: self._fetch_ecb_rates,
        }

        # Configuration
        self.base_currency = CurrencyCode.USD
        self.supported_currencies = list(CurrencyCode)
        self.rate_cache_ttl = 300  # 5 minutes
        self.conversion_fee_rate = Decimal("0.0025")  # 0.25%

        # Start background rate updates
        asyncio.create_task(self._start_rate_updates())

    async def get_exchange_rate(
        self,
        from_currency: str,
        to_currency: str,
        provider: Optional[ExchangeRateProvider] = None,
    ) -> Optional[ExchangeRate]:
        """Get current exchange rate between two currencies"""
        try:
            # Check cache first
            cache_key = f"rate:{from_currency}:{to_currency}"
            cached_rate = self.redis_client.get(cache_key)

            if cached_rate:
                rate_data = json.loads(cached_rate)
                return ExchangeRate(
                    base_currency=rate_data["base_currency"],
                    target_currency=rate_data["target_currency"],
                    rate=Decimal(rate_data["rate"]),
                    timestamp=datetime.fromisoformat(rate_data["timestamp"]),
                    provider=ExchangeRateProvider(rate_data["provider"]),
                    bid_rate=(
                        Decimal(rate_data["bid_rate"])
                        if rate_data.get("bid_rate")
                        else None
                    ),
                    ask_rate=(
                        Decimal(rate_data["ask_rate"])
                        if rate_data.get("ask_rate")
                        else None
                    ),
                    mid_rate=(
                        Decimal(rate_data["mid_rate"])
                        if rate_data.get("mid_rate")
                        else None
                    ),
                    spread=(
                        Decimal(rate_data["spread"])
                        if rate_data.get("spread")
                        else None
                    ),
                )

            # Fetch from database
            session = self.Session()
            try:
                rate_record = (
                    session.query(ExchangeRateModel)
                    .filter(
                        ExchangeRateModel.base_currency == from_currency,
                        ExchangeRateModel.target_currency == to_currency,
                        ExchangeRateModel.is_active == True,
                    )
                    .order_by(ExchangeRateModel.timestamp.desc())
                    .first()
                )

                if rate_record:
                    rate = ExchangeRate(
                        base_currency=rate_record.base_currency,
                        target_currency=rate_record.target_currency,
                        rate=rate_record.rate,
                        timestamp=rate_record.timestamp,
                        provider=ExchangeRateProvider(rate_record.provider),
                        bid_rate=rate_record.bid_rate,
                        ask_rate=rate_record.ask_rate,
                        mid_rate=rate_record.mid_rate,
                        spread=rate_record.spread,
                    )

                    # Cache the rate
                    await self._cache_exchange_rate(rate)
                    return rate

                # If not in database, fetch from provider
                if provider:
                    return await self._fetch_rate_from_provider(
                        from_currency, to_currency, provider
                    )

                return None

            finally:
                session.close()

        except Exception as e:
            logger.error(f"Error getting exchange rate: {str(e)}")
            return None

    async def convert_currency(
        self, from_currency: str, to_currency: str, amount: Decimal, user_id: str
    ) -> Optional[CurrencyConversion]:
        """Convert amount from one currency to another"""
        try:
            # Get exchange rate
            rate = await self.get_exchange_rate(from_currency, to_currency)
            if not rate:
                raise ValueError(
                    f"Exchange rate not available for {from_currency} to {to_currency}"
                )

            # Calculate conversion using Decimal for precision
            converted_amount = amount * rate.rate

            # Ensure all calculations use Decimal and are rounded to a consistent precision (e.g., 8 decimal places)
            precision = Decimal("0.00000001")

            conversion_fee = (converted_amount * self.conversion_fee_rate).quantize(
                precision, rounding=ROUND_HALF_UP
            )
            net_amount = (converted_amount - conversion_fee).quantize(
                precision, rounding=ROUND_HALF_UP
            )
            converted_amount = converted_amount.quantize(
                precision, rounding=ROUND_HALF_UP
            )

            # Create conversion record
            conversion = CurrencyConversion(
                conversion_id=f"conv_{datetime.now().strftime('%Y%m%d%H%M%S')}_{user_id}",
                from_currency=from_currency,
                to_currency=to_currency,
                from_amount=amount,
                to_amount=converted_amount,
                exchange_rate=rate.rate,
                conversion_fee=conversion_fee,
                net_amount=net_amount,
                timestamp=datetime.now(timezone.utc),
                rate_provider=rate.provider,
            )

            # Store in database
            await self._store_conversion(conversion, user_id)

            # Update FX positions
            await self._update_fx_positions(user_id, from_currency, -amount, rate.rate)
            await self._update_fx_positions(
                user_id, to_currency, net_amount, Decimal("1.0")
            )

            logger.info(f"Currency conversion completed: {conversion.conversion_id}")
            return conversion

        except Exception as e:
            logger.error(f"Error converting currency: {str(e)}")
            return None

    async def get_fx_position(
        self, user_id: str, currency: str
    ) -> Optional[FXPosition]:
        """Get FX position for user and currency"""
        try:
            session = self.Session()
            try:
                position_record = (
                    session.query(FXPositionModel)
                    .filter(
                        FXPositionModel.user_id == user_id,
                        FXPositionModel.currency == currency,
                    )
                    .first()
                )

                if position_record:
                    # Update unrealized P&L
                    current_rate = await self.get_exchange_rate(
                        currency, self.base_currency.value
                    )
                    if current_rate:
                        current_value = position_record.amount * current_rate.rate
                        unrealized_pnl = (
                            current_value - position_record.base_currency_value
                        )

                        # Update in database
                        position_record.unrealized_pnl = unrealized_pnl
                        position_record.last_updated = datetime.now(timezone.utc)
                        session.commit()

                        return FXPosition(
                            currency=position_record.currency,
                            amount=position_record.amount,
                            base_currency_value=current_value,
                            unrealized_pnl=unrealized_pnl,
                            realized_pnl=position_record.realized_pnl,
                            average_rate=position_record.average_rate,
                            last_updated=position_record.last_updated,
                        )

                return None

            finally:
                session.close()

        except Exception as e:
            logger.error(f"Error getting FX position: {str(e)}")
            return None

    async def get_all_fx_positions(self, user_id: str) -> List[FXPosition]:
        """Get all FX positions for user"""
        try:
            session = self.Session()
            try:
                position_records = (
                    session.query(FXPositionModel)
                    .filter(FXPositionModel.user_id == user_id)
                    .all()
                )

                positions = []
                for record in position_records:
                    position = await self.get_fx_position(user_id, record.currency)
                    if position:
                        positions.append(position)

                return positions

            finally:
                session.close()

        except Exception as e:
            logger.error(f"Error getting FX positions: {str(e)}")
            return []

    async def calculate_fx_exposure(self, user_id: str) -> Dict[str, Any]:
        """Calculate total FX exposure for user"""
        try:
            positions = await self.get_all_fx_positions(user_id)

            total_exposure = Decimal("0")
            total_unrealized_pnl = Decimal("0")
            total_realized_pnl = Decimal("0")
            currency_breakdown = {}

            for position in positions:
                total_exposure += abs(position.base_currency_value)
                total_unrealized_pnl += position.unrealized_pnl
                total_realized_pnl += position.realized_pnl

                currency_breakdown[position.currency] = {
                    "amount": float(position.amount),
                    "base_currency_value": float(position.base_currency_value),
                    "unrealized_pnl": float(position.unrealized_pnl),
                    "percentage_of_total": float(
                        (abs(position.base_currency_value) / total_exposure * 100)
                        if total_exposure > 0
                        else 0
                    ),
                }

            return {
                "user_id": user_id,
                "base_currency": self.base_currency.value,
                "total_exposure": float(total_exposure),
                "total_unrealized_pnl": float(total_unrealized_pnl),
                "total_realized_pnl": float(total_realized_pnl),
                "total_pnl": float(total_unrealized_pnl + total_realized_pnl),
                "currency_breakdown": currency_breakdown,
                "calculated_at": datetime.now(timezone.utc).isoformat(),
            }

        except Exception as e:
            logger.error(f"Error calculating FX exposure: {str(e)}")
            return {}

    async def _fetch_rate_from_provider(
        self, from_currency: str, to_currency: str, provider: ExchangeRateProvider
    ) -> Optional[ExchangeRate]:
        """Fetch exchange rate from specific provider"""
        try:
            if provider in self.providers:
                rates = await self.providers[provider]()

                # Find the specific rate
                for rate in rates:
                    if (
                        rate.base_currency == from_currency
                        and rate.target_currency == to_currency
                    ):
                        # Store in database
                        await self._store_exchange_rate(rate)
                        # Cache the rate
                        await self._cache_exchange_rate(rate)
                        return rate

            return None

        except Exception as e:
            logger.error(f"Error fetching rate from provider {provider}: {str(e)}")
            return None

    async def _fetch_fixer_io_rates(self) -> List[ExchangeRate]:
        """Fetch rates from Fixer.io API"""
        try:
            # This would use actual Fixer.io API
            # For demo, returning mock data
            base_currency = "USD"
            rates_data = {
                "EUR": 0.85,
                "GBP": 0.73,
                "JPY": 110.0,
                "CAD": 1.25,
                "AUD": 1.35,
            }

            rates = []
            timestamp = datetime.now(timezone.utc)

            for target_currency, rate_value in rates_data.items():
                rate = ExchangeRate(
                    base_currency=base_currency,
                    target_currency=target_currency,
                    rate=Decimal(str(rate_value)),
                    timestamp=timestamp,
                    provider=ExchangeRateProvider.FIXER_IO,
                    mid_rate=Decimal(str(rate_value)),
                    spread=Decimal("0.001"),  # 0.1% spread
                )

                # Calculate bid/ask from mid and spread
                spread_amount = rate.mid_rate * rate.spread / 2
                rate.bid_rate = rate.mid_rate - spread_amount
                rate.ask_rate = rate.mid_rate + spread_amount

                rates.append(rate)

            return rates

        except Exception as e:
            logger.error(f"Error fetching Fixer.io rates: {str(e)}")
            return []

    async def _fetch_oxr_rates(self) -> List[ExchangeRate]:
        """Fetch rates from Open Exchange Rates API"""
        try:
            # Mock implementation
            base_currency = "USD"
            rates_data = {
                "EUR": 0.851,
                "GBP": 0.732,
                "JPY": 109.8,
                "CAD": 1.248,
                "AUD": 1.352,
            }

            rates = []
            timestamp = datetime.now(timezone.utc)

            for target_currency, rate_value in rates_data.items():
                rate = ExchangeRate(
                    base_currency=base_currency,
                    target_currency=target_currency,
                    rate=Decimal(str(rate_value)),
                    timestamp=timestamp,
                    provider=ExchangeRateProvider.OPEN_EXCHANGE_RATES,
                    mid_rate=Decimal(str(rate_value)),
                    spread=Decimal("0.0015"),  # 0.15% spread
                )

                spread_amount = rate.mid_rate * rate.spread / 2
                rate.bid_rate = rate.mid_rate - spread_amount
                rate.ask_rate = rate.mid_rate + spread_amount

                rates.append(rate)

            return rates

        except Exception as e:
            logger.error(f"Error fetching OXR rates: {str(e)}")
            return []

    async def _fetch_ecb_rates(self) -> List[ExchangeRate]:
        """Fetch rates from European Central Bank"""
        try:
            # Mock implementation for ECB rates
            base_currency = "EUR"
            rates_data = {
                "USD": 1.18,
                "GBP": 0.86,
                "JPY": 129.5,
                "CAD": 1.47,
                "AUD": 1.59,
            }

            rates = []
            timestamp = datetime.now(timezone.utc)

            for target_currency, rate_value in rates_data.items():
                rate = ExchangeRate(
                    base_currency=base_currency,
                    target_currency=target_currency,
                    rate=Decimal(str(rate_value)),
                    timestamp=timestamp,
                    provider=ExchangeRateProvider.ECB,
                    mid_rate=Decimal(str(rate_value)),
                    spread=Decimal("0.0008"),  # 0.08% spread
                )

                spread_amount = rate.mid_rate * rate.spread / 2
                rate.bid_rate = rate.mid_rate - spread_amount
                rate.ask_rate = rate.mid_rate + spread_amount

                rates.append(rate)

            return rates

        except Exception as e:
            logger.error(f"Error fetching ECB rates: {str(e)}")
            return []

    async def _store_exchange_rate(self, rate: ExchangeRate):
        """Store exchange rate in database"""
        try:
            session = self.Session()
            try:
                rate_record = ExchangeRateModel(
                    id=f"{rate.base_currency}_{rate.target_currency}_{rate.timestamp.strftime('%Y%m%d%H%M%S')}",
                    base_currency=rate.base_currency,
                    target_currency=rate.target_currency,
                    rate=rate.rate,
                    bid_rate=rate.bid_rate,
                    ask_rate=rate.ask_rate,
                    mid_rate=rate.mid_rate,
                    spread=rate.spread,
                    provider=rate.provider.value,
                    timestamp=rate.timestamp,
                )

                session.add(rate_record)
                session.commit()

            finally:
                session.close()

        except Exception as e:
            logger.error(f"Error storing exchange rate: {str(e)}")

    async def _cache_exchange_rate(self, rate: ExchangeRate):
        """Cache exchange rate in Redis"""
        try:
            cache_key = f"rate:{rate.base_currency}:{rate.target_currency}"
            cache_data = {
                "base_currency": rate.base_currency,
                "target_currency": rate.target_currency,
                "rate": str(rate.rate),
                "timestamp": rate.timestamp.isoformat(),
                "provider": rate.provider.value,
                "bid_rate": str(rate.bid_rate) if rate.bid_rate else None,
                "ask_rate": str(rate.ask_rate) if rate.ask_rate else None,
                "mid_rate": str(rate.mid_rate) if rate.mid_rate else None,
                "spread": str(rate.spread) if rate.spread else None,
            }

            self.redis_client.setex(
                cache_key, self.rate_cache_ttl, json.dumps(cache_data)
            )

        except Exception as e:
            logger.error(f"Error caching exchange rate: {str(e)}")

    async def _store_conversion(self, conversion: CurrencyConversion, user_id: str):
        """Store currency conversion in database"""
        try:
            session = self.Session()
            try:
                conversion_record = CurrencyConversionModel(
                    conversion_id=conversion.conversion_id,
                    from_currency=conversion.from_currency,
                    to_currency=conversion.to_currency,
                    from_amount=conversion.from_amount,
                    to_amount=conversion.to_amount,
                    exchange_rate=conversion.exchange_rate,
                    conversion_fee=conversion.conversion_fee,
                    net_amount=conversion.net_amount,
                    rate_provider=conversion.rate_provider.value,
                    timestamp=conversion.timestamp,
                    user_id=user_id,
                )

                session.add(conversion_record)
                session.commit()

            finally:
                session.close()

        except Exception as e:
            logger.error(f"Error storing conversion: {str(e)}")

    async def _update_fx_positions(
        self, user_id: str, currency: str, amount: Decimal, rate: Decimal
    ):
        """Update FX positions for user"""
        try:
            session = self.Session()
            try:
                position_record = (
                    session.query(FXPositionModel)
                    .filter(
                        FXPositionModel.user_id == user_id,
                        FXPositionModel.currency == currency,
                    )
                    .first()
                )

                if position_record:
                    # Update existing position
                    old_amount = position_record.amount
                    new_amount = old_amount + amount

                    if new_amount != 0:
                        # Calculate new average rate
                        old_value = old_amount * position_record.average_rate
                        new_value = amount * rate
                        total_value = old_value + new_value
                        new_average_rate = total_value / new_amount

                        position_record.amount = new_amount
                        position_record.average_rate = new_average_rate
                        position_record.base_currency_value = (
                            new_amount * new_average_rate
                        )
                    else:
                        # Position closed
                        realized_pnl = position_record.amount * (
                            rate - position_record.average_rate
                        )
                        position_record.realized_pnl += realized_pnl
                        position_record.amount = Decimal("0")
                        position_record.base_currency_value = Decimal("0")
                        position_record.unrealized_pnl = Decimal("0")

                    position_record.last_updated = datetime.now(timezone.utc)

                else:
                    # Create new position
                    position_record = FXPositionModel(
                        id=f"{user_id}_{currency}_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                        user_id=user_id,
                        currency=currency,
                        amount=amount,
                        base_currency_value=amount * rate,
                        average_rate=rate,
                        last_updated=datetime.now(timezone.utc),
                    )
                    session.add(position_record)

                session.commit()

            finally:
                session.close()

        except Exception as e:
            logger.error(f"Error updating FX positions: {str(e)}")

    async def _start_rate_updates(self):
        """Start background task for rate updates"""
        while True:
            try:
                # Update rates from all providers
                for provider in self.providers.keys():
                    rates = await self.providers[provider]()
                    for rate in rates:
                        await self._store_exchange_rate(rate)
                        await self._cache_exchange_rate(rate)

                logger.info("Exchange rates updated successfully")

                # Wait 5 minutes before next update
                await asyncio.sleep(300)

            except Exception as e:
                logger.error(f"Error in rate updates: {str(e)}")
                await asyncio.sleep(60)  # Wait 1 minute on error


class FXRiskManager:
    """
    Foreign exchange risk management system
    """

    def __init__(self, exchange_rate_service: ExchangeRateService):
        self.exchange_rate_service = exchange_rate_service
        self.var_confidence_level = 0.95  # 95% VaR
        self.max_position_limit = Decimal("1000000")  # $1M per currency
        self.max_total_exposure = Decimal("10000000")  # $10M total

    async def calculate_value_at_risk(
        self, user_id: str, time_horizon_days: int = 1
    ) -> Dict[str, Any]:
        """Calculate Value at Risk for FX positions"""
        try:
            positions = await self.exchange_rate_service.get_all_fx_positions(user_id)

            if not positions:
                return {"var": 0.0, "positions": []}

            # Get historical volatilities (simplified calculation)
            var_by_currency = {}
            total_var = Decimal("0")

            for position in positions:
                # Simplified VaR calculation using historical volatility
                volatility = await self._get_currency_volatility(position.currency)
                position_var = (
                    abs(position.base_currency_value)
                    * volatility
                    * Decimal(str(np.sqrt(time_horizon_days)))
                )

                var_by_currency[position.currency] = {
                    "position_value": float(position.base_currency_value),
                    "volatility": float(volatility),
                    "var": float(position_var),
                }

                total_var += position_var

            return {
                "user_id": user_id,
                "time_horizon_days": time_horizon_days,
                "confidence_level": self.var_confidence_level,
                "total_var": float(total_var),
                "var_by_currency": var_by_currency,
                "calculated_at": datetime.now(timezone.utc).isoformat(),
            }

        except Exception as e:
            logger.error(f"Error calculating VaR: {str(e)}")
            return {}

    async def check_position_limits(self, user_id: str) -> Dict[str, Any]:
        """Check if positions exceed risk limits"""
        try:
            positions = await self.exchange_rate_service.get_all_fx_positions(user_id)
            exposure = await self.exchange_rate_service.calculate_fx_exposure(user_id)

            limit_violations = []

            # Check individual currency limits
            for position in positions:
                if abs(position.base_currency_value) > self.max_position_limit:
                    limit_violations.append(
                        {
                            "type": "position_limit",
                            "currency": position.currency,
                            "current_exposure": float(position.base_currency_value),
                            "limit": float(self.max_position_limit),
                            "excess": float(
                                abs(position.base_currency_value)
                                - self.max_position_limit
                            ),
                        }
                    )

            # Check total exposure limit
            total_exposure = Decimal(str(exposure.get("total_exposure", 0)))
            if total_exposure > self.max_total_exposure:
                limit_violations.append(
                    {
                        "type": "total_exposure_limit",
                        "current_exposure": float(total_exposure),
                        "limit": float(self.max_total_exposure),
                        "excess": float(total_exposure - self.max_total_exposure),
                    }
                )

            return {
                "user_id": user_id,
                "within_limits": len(limit_violations) == 0,
                "violations": limit_violations,
                "checked_at": datetime.now(timezone.utc).isoformat(),
            }

        except Exception as e:
            logger.error(f"Error checking position limits: {str(e)}")
            return {}

    async def _get_currency_volatility(self, currency: str) -> Decimal:
        """Get historical volatility for currency (simplified)"""
        # In production, this would calculate from historical data
        volatility_map = {
            "EUR": Decimal("0.08"),  # 8% annual volatility
            "GBP": Decimal("0.12"),  # 12% annual volatility
            "JPY": Decimal("0.10"),  # 10% annual volatility
            "CAD": Decimal("0.09"),  # 9% annual volatility
            "AUD": Decimal("0.14"),  # 14% annual volatility
        }

        return volatility_map.get(currency, Decimal("0.15"))  # Default 15%


# Export main classes
__all__ = [
    "ExchangeRateService",
    "FXRiskManager",
    "ExchangeRate",
    "CurrencyConversion",
    "FXPosition",
    "CurrencyCode",
    "ExchangeRateProvider",
    "FXTransactionType",
]

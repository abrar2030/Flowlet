import logging
import re
import statistics
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

"\nAI-Powered Transaction Categorization and Intelligence System\n"
logger = logging.getLogger(__name__)


class TransactionCategory(Enum):
    """Transaction categories"""

    GROCERIES = "groceries"
    RESTAURANTS = "restaurants"
    GAS_STATIONS = "gas_stations"
    RETAIL_SHOPPING = "retail_shopping"
    ONLINE_SHOPPING = "online_shopping"
    ENTERTAINMENT = "entertainment"
    TRAVEL = "travel"
    TRANSPORTATION = "transportation"
    HEALTHCARE = "healthcare"
    UTILITIES = "utilities"
    INSURANCE = "insurance"
    EDUCATION = "education"
    PROFESSIONAL_SERVICES = "professional_services"
    HOME_IMPROVEMENT = "home_improvement"
    PERSONAL_CARE = "personal_care"
    CHARITY = "charity"
    INVESTMENTS = "investments"
    TRANSFERS = "transfers"
    ATM_WITHDRAWALS = "atm_withdrawals"
    FEES = "fees"
    INCOME = "income"
    REFUNDS = "refunds"
    OTHER = "other"


class SpendingPattern(Enum):
    """Spending pattern types"""

    REGULAR = "regular"
    SEASONAL = "seasonal"
    INCREASING = "increasing"
    DECREASING = "decreasing"
    VOLATILE = "volatile"
    STABLE = "stable"


@dataclass
class TransactionInsight:
    """AI-generated transaction insight"""

    transaction_id: str
    category: TransactionCategory
    confidence: float
    subcategory: Optional[str]
    tags: List[str]
    is_recurring: bool
    anomaly_score: float
    insights: List[str]
    recommendations: List[str]


@dataclass
class SpendingAnalysis:
    """Comprehensive spending analysis"""

    user_id: str
    period_start: datetime
    period_end: datetime
    total_spending: Decimal
    category_breakdown: Dict[str, Decimal]
    spending_pattern: SpendingPattern
    monthly_trend: float
    budget_recommendations: Dict[str, Decimal]
    insights: List[str]
    alerts: List[str]


class AITransactionCategorizer:
    """AI-powered transaction categorization system"""

    def __init__(self) -> Any:
        self.merchant_patterns = {
            TransactionCategory.GROCERIES: [
                "walmart|target|kroger|safeway|whole foods|trader joe|costco|sam\\'s club",
                "grocery|supermarket|market|food store|deli|butcher",
                "fresh market|organic|produce|farmers market",
            ],
            TransactionCategory.RESTAURANTS: [
                "mcdonald|burger king|kfc|subway|pizza|starbucks|dunkin|taco bell",
                "restaurant|cafe|bistro|grill|diner|bar|pub|brewery",
                "food delivery|doordash|uber eats|grubhub|postmates",
            ],
            TransactionCategory.GAS_STATIONS: [
                "shell|exxon|bp|chevron|mobil|texaco|citgo|marathon|sunoco",
                "gas station|fuel|petrol|gasoline",
            ],
            TransactionCategory.RETAIL_SHOPPING: [
                "amazon|ebay|best buy|home depot|lowes|macy|nordstrom|gap",
                "department store|retail|shopping|mall|outlet",
            ],
            TransactionCategory.ONLINE_SHOPPING: [
                "amazon\\.com|paypal|stripe|square|shopify",
                "online|e-commerce|digital|web store",
            ],
            TransactionCategory.ENTERTAINMENT: [
                "netflix|spotify|disney|hulu|youtube|apple music|amazon prime",
                "movie|theater|cinema|concert|sports|game|entertainment",
            ],
            TransactionCategory.TRAVEL: [
                "airline|airport|hotel|motel|airbnb|booking|expedia|uber|lyft",
                "travel|vacation|trip|flight|rental car|taxi",
            ],
            TransactionCategory.HEALTHCARE: [
                "hospital|clinic|doctor|dentist|pharmacy|cvs|walgreens|rite aid",
                "medical|health|dental|vision|prescription|medicine",
            ],
            TransactionCategory.UTILITIES: [
                "electric|gas|water|sewer|internet|cable|phone|wireless",
                "utility|bill|service|telecom|verizon|at&t|comcast",
            ],
            TransactionCategory.EDUCATION: [
                "university|college|school|tuition|education|learning|course",
                "textbook|supplies|student|academic",
            ],
        }
        self.amount_patterns = {
            TransactionCategory.ATM_WITHDRAWALS: (Decimal("20"), Decimal("500")),
            TransactionCategory.UTILITIES: (Decimal("50"), Decimal("300")),
            TransactionCategory.INSURANCE: (Decimal("100"), Decimal("1000")),
            TransactionCategory.GROCERIES: (Decimal("10"), Decimal("200")),
        }
        self.recurring_patterns = {}
        self.user_profiles = {}
        self.category_keywords = {
            TransactionCategory.GROCERIES: [
                "grocery",
                "supermarket",
                "food",
                "produce",
                "organic",
                "fresh",
                "meat",
                "dairy",
                "bakery",
                "deli",
                "frozen",
                "snacks",
            ],
            TransactionCategory.RESTAURANTS: [
                "restaurant",
                "cafe",
                "bar",
                "grill",
                "pizza",
                "burger",
                "sushi",
                "chinese",
                "italian",
                "mexican",
                "fast food",
                "delivery",
            ],
            TransactionCategory.ENTERTAINMENT: [
                "movie",
                "theater",
                "concert",
                "music",
                "streaming",
                "game",
                "sports",
                "recreation",
                "fun",
                "leisure",
                "hobby",
            ],
            TransactionCategory.TRAVEL: [
                "hotel",
                "flight",
                "airline",
                "car rental",
                "taxi",
                "uber",
                "vacation",
                "trip",
                "travel",
                "booking",
                "resort",
            ],
        }

    def categorize_transaction(
        self, transaction_data: Dict[str, Any]
    ) -> TransactionInsight:
        """Categorize a single transaction using AI techniques"""
        merchant_name = transaction_data.get("merchant_name", "").lower()
        amount = Decimal(str(transaction_data.get("amount", 0)))
        description = transaction_data.get("description", "").lower()
        merchant_category = transaction_data.get("merchant_category", "").lower()
        category, confidence = self._categorize_by_merchant(merchant_name)
        desc_category, desc_confidence = self._categorize_by_description(description)
        if desc_confidence > confidence:
            category = desc_category
            confidence = desc_confidence
        mcc_category, mcc_confidence = self._categorize_by_mcc(merchant_category)
        if mcc_confidence > confidence:
            category = mcc_category
            confidence = mcc_confidence
        amount_category, amount_confidence = self._categorize_by_amount(amount)
        if amount_confidence > 0.3 and confidence < 0.7:
            category = amount_category
            confidence = max(confidence, amount_confidence)
        subcategory = self._generate_subcategory(merchant_name, category)
        tags = self._generate_tags(transaction_data, category)
        is_recurring = self._is_recurring_transaction(transaction_data)
        anomaly_score = self._calculate_anomaly_score(transaction_data, category)
        insights = self._generate_insights(
            transaction_data, category, is_recurring, anomaly_score
        )
        recommendations = self._generate_recommendations(
            transaction_data, category, insights
        )
        return TransactionInsight(
            transaction_id=transaction_data.get("transaction_id", ""),
            category=category,
            confidence=confidence,
            subcategory=subcategory,
            tags=tags,
            is_recurring=is_recurring,
            anomaly_score=anomaly_score,
            insights=insights,
            recommendations=recommendations,
        )

    def _categorize_by_merchant(
        self, merchant_name: str
    ) -> Tuple[TransactionCategory, float]:
        """Categorize based on merchant name patterns"""
        best_category = TransactionCategory.OTHER
        best_confidence = 0.0
        for category, patterns in self.merchant_patterns.items():
            for pattern in patterns:
                if re.search(pattern, merchant_name, re.IGNORECASE):
                    confidence = 0.8 + len(pattern) / 100
                    if confidence > best_confidence:
                        best_category = category
                        best_confidence = min(confidence, 0.95)
        return (best_category, best_confidence)

    def _categorize_by_description(
        self, description: str
    ) -> Tuple[TransactionCategory, float]:
        """Categorize based on transaction description"""
        best_category = TransactionCategory.OTHER
        best_confidence = 0.0
        for category, keywords in self.category_keywords.items():
            matches = sum((1 for keyword in keywords if keyword in description))
            if matches > 0:
                confidence = min(0.6 + matches * 0.1, 0.9)
                if confidence > best_confidence:
                    best_category = category
                    best_confidence = confidence
        return (best_category, best_confidence)

    def _categorize_by_mcc(
        self, merchant_category: str
    ) -> Tuple[TransactionCategory, float]:
        """Categorize based on merchant category code"""
        mcc_mapping = {
            "grocery": TransactionCategory.GROCERIES,
            "restaurant": TransactionCategory.RESTAURANTS,
            "gas": TransactionCategory.GAS_STATIONS,
            "retail": TransactionCategory.RETAIL_SHOPPING,
            "entertainment": TransactionCategory.ENTERTAINMENT,
            "travel": TransactionCategory.TRAVEL,
            "healthcare": TransactionCategory.HEALTHCARE,
            "utility": TransactionCategory.UTILITIES,
            "education": TransactionCategory.EDUCATION,
        }
        for mcc_key, category in mcc_mapping.items():
            if mcc_key in merchant_category:
                return (category, 0.7)
        return (TransactionCategory.OTHER, 0.0)

    def _categorize_by_amount(
        self, amount: Decimal
    ) -> Tuple[TransactionCategory, float]:
        """Categorize based on transaction amount patterns"""
        for category, (min_amount, max_amount) in self.amount_patterns.items():
            if min_amount <= amount <= max_amount:
                mid_point = (min_amount + max_amount) / 2
                distance_from_mid = abs(amount - mid_point)
                max_distance = (max_amount - min_amount) / 2
                confidence = 0.5 - distance_from_mid / max_distance * 0.3
                return (category, max(confidence, 0.2))
        return (TransactionCategory.OTHER, 0.0)

    def _generate_subcategory(
        self, merchant_name: str, category: TransactionCategory
    ) -> Optional[str]:
        """Generate subcategory based on merchant and category"""
        subcategory_patterns = {
            TransactionCategory.RESTAURANTS: {
                "fast_food": "mcdonald|burger king|kfc|subway|taco bell|wendy",
                "coffee": "starbucks|dunkin|coffee|cafe",
                "pizza": "pizza|domino|papa john",
                "fine_dining": "restaurant|bistro|grill",
            },
            TransactionCategory.RETAIL_SHOPPING: {
                "electronics": "best buy|apple store|electronics",
                "clothing": "macy|nordstrom|gap|clothing|fashion",
                "home_goods": "home depot|lowes|ikea|furniture",
                "department_store": "walmart|target|costco",
            },
            TransactionCategory.ENTERTAINMENT: {
                "streaming": "netflix|spotify|hulu|disney|prime",
                "gaming": "steam|xbox|playstation|game",
                "movies": "theater|cinema|movie",
                "music": "concert|music|spotify",
            },
        }
        if category in subcategory_patterns:
            for subcategory, pattern in subcategory_patterns[category].items():
                if re.search(pattern, merchant_name, re.IGNORECASE):
                    return subcategory
        return None

    def _generate_tags(
        self, transaction_data: Dict[str, Any], category: TransactionCategory
    ) -> List[str]:
        """Generate relevant tags for the transaction"""
        tags = []
        amount = Decimal(str(transaction_data.get("amount", 0)))
        merchant_name = transaction_data.get("merchant_name", "").lower()
        is_online = transaction_data.get("is_online", False)
        if amount > Decimal("500"):
            tags.append("large_purchase")
        elif amount < Decimal("5"):
            tags.append("small_purchase")
        if is_online:
            tags.append("online")
        else:
            tags.append("in_person")
        if category == TransactionCategory.GROCERIES:
            if "organic" in merchant_name:
                tags.append("organic")
            if "wholesale" in merchant_name or "costco" in merchant_name:
                tags.append("bulk_purchase")
        elif category == TransactionCategory.RESTAURANTS:
            if "delivery" in merchant_name:
                tags.append("delivery")
            if any((word in merchant_name for word in ["mcdonald", "burger", "kfc"])):
                tags.append("fast_food")
        elif category == TransactionCategory.TRAVEL:
            if "hotel" in merchant_name:
                tags.append("accommodation")
            if "airline" in merchant_name or "flight" in merchant_name:
                tags.append("flight")
        hour = datetime.now().hour
        if 6 <= hour <= 11:
            tags.append("morning")
        elif 12 <= hour <= 17:
            tags.append("afternoon")
        elif 18 <= hour <= 22:
            tags.append("evening")
        else:
            tags.append("late_night")
        return tags

    def _is_recurring_transaction(self, transaction_data: Dict[str, Any]) -> bool:
        """Detect if transaction is part of a recurring pattern"""
        merchant_name = transaction_data.get("merchant_name", "")
        amount = Decimal(str(transaction_data.get("amount", 0)))
        user_id = transaction_data.get("user_id", "")
        signature = f"{merchant_name}_{amount}_{user_id}"
        if signature in self.recurring_patterns:
            pattern = self.recurring_patterns[signature]
            last_transaction = pattern["last_transaction"]
            current_time = datetime.now(timezone.utc)
            time_diff = (current_time - last_transaction).days
            if 25 <= time_diff <= 35:
                pattern["frequency"] = "monthly"
                pattern["count"] += 1
                pattern["last_transaction"] = current_time
                return pattern["count"] >= 2
            elif 6 <= time_diff <= 8:
                pattern["frequency"] = "weekly"
                pattern["count"] += 1
                pattern["last_transaction"] = current_time
                return pattern["count"] >= 3
        else:
            self.recurring_patterns[signature] = {
                "count": 1,
                "first_transaction": datetime.now(timezone.utc),
                "last_transaction": datetime.now(timezone.utc),
                "frequency": "unknown",
            }
        return False

    def _calculate_anomaly_score(
        self, transaction_data: Dict[str, Any], category: TransactionCategory
    ) -> float:
        """Calculate anomaly score for the transaction"""
        user_id = transaction_data.get("user_id", "")
        amount = Decimal(str(transaction_data.get("amount", 0)))
        user_profile = self.user_profiles.get(user_id, {})
        category_history = user_profile.get(category.value, [])
        if len(category_history) < 3:
            return 0.0
        amounts = [Decimal(str(t["amount"])) for t in category_history]
        mean_amount = statistics.mean(amounts)
        std_amount = statistics.stdev(amounts) if len(amounts) > 1 else Decimal("0")
        if std_amount == 0:
            return 0.0
        z_score = abs(float((amount - mean_amount) / std_amount))
        anomaly_score = min(z_score / 3.0, 1.0)
        return anomaly_score

    def _generate_insights(
        self,
        transaction_data: Dict[str, Any],
        category: TransactionCategory,
        is_recurring: bool,
        anomaly_score: float,
    ) -> List[str]:
        """Generate AI insights about the transaction"""
        insights = []
        amount = Decimal(str(transaction_data.get("amount", 0)))
        transaction_data.get("merchant_name", "")
        if is_recurring:
            insights.append(f"This appears to be a recurring {category.value} expense")
        if anomaly_score > 0.7:
            insights.append(
                f"This transaction amount is unusually high for your {category.value} spending"
            )
        elif anomaly_score > 0.5:
            insights.append(
                f"This transaction amount is higher than your typical {category.value} spending"
            )
        if category == TransactionCategory.GROCERIES and amount > Decimal("200"):
            insights.append(
                "Large grocery purchase - consider if this was a bulk shopping trip"
            )
        elif category == TransactionCategory.RESTAURANTS and amount > Decimal("100"):
            insights.append(
                "High restaurant spending - this might be a special occasion or group meal"
            )
        elif category == TransactionCategory.GAS_STATIONS and amount > Decimal("80"):
            insights.append(
                "Large fuel purchase - possibly for a long trip or large vehicle"
            )
        hour = datetime.now().hour
        if category == TransactionCategory.RESTAURANTS and (hour < 6 or hour > 23):
            insights.append("Late night or early morning dining - unusual timing")
        return insights

    def _generate_recommendations(
        self,
        transaction_data: Dict[str, Any],
        category: TransactionCategory,
        insights: List[str],
    ) -> List[str]:
        """Generate AI recommendations based on transaction analysis"""
        recommendations = []
        amount = Decimal(str(transaction_data.get("amount", 0)))
        if category == TransactionCategory.RESTAURANTS and amount > Decimal("50"):
            recommendations.append(
                "Consider cooking at home more often to save on dining expenses"
            )
        elif category == TransactionCategory.RETAIL_SHOPPING and amount > Decimal(
            "200"
        ):
            recommendations.append(
                "Review if this purchase aligns with your budget goals"
            )
        elif category == TransactionCategory.ENTERTAINMENT and amount > Decimal("100"):
            recommendations.append(
                "Track entertainment spending to ensure it stays within budget"
            )
        if "large_purchase" in transaction_data.get("tags", []):
            recommendations.append(
                "Consider setting up automatic savings for future large purchases"
            )
        if any(("recurring" in insight for insight in insights)):
            recommendations.append(
                "Consider setting up automatic payments for recurring expenses"
            )
        return recommendations

    def analyze_spending_patterns(
        self, user_id: str, period_days: int = 30
    ) -> SpendingAnalysis:
        """Analyze user's spending patterns using AI"""
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=period_days)
        user_profile = self.user_profiles.get(user_id, {})
        all_transactions = []
        for category_data in user_profile.values():
            if isinstance(category_data, list):
                all_transactions.extend(category_data)
        period_transactions = [
            t
            for t in all_transactions
            if start_date <= datetime.fromisoformat(t["timestamp"]) <= end_date
        ]
        if not period_transactions:
            return SpendingAnalysis(
                user_id=user_id,
                period_start=start_date,
                period_end=end_date,
                total_spending=Decimal("0"),
                category_breakdown={},
                spending_pattern=SpendingPattern.STABLE,
                monthly_trend=0.0,
                budget_recommendations={},
                insights=[],
                alerts=[],
            )
        total_spending = sum((Decimal(str(t["amount"])) for t in period_transactions))
        category_breakdown = defaultdict(Decimal)
        for transaction in period_transactions:
            category = transaction.get("category", "other")
            amount = Decimal(str(transaction["amount"]))
            category_breakdown[category] += amount
        spending_pattern = self._analyze_spending_pattern(period_transactions)
        monthly_trend = self._calculate_monthly_trend(period_transactions)
        budget_recommendations = self._generate_budget_recommendations(
            category_breakdown, total_spending
        )
        insights = self._generate_spending_insights(
            category_breakdown, total_spending, spending_pattern
        )
        alerts = self._generate_spending_alerts(
            category_breakdown, total_spending, monthly_trend
        )
        return SpendingAnalysis(
            user_id=user_id,
            period_start=start_date,
            period_end=end_date,
            total_spending=total_spending,
            category_breakdown=dict(category_breakdown),
            spending_pattern=spending_pattern,
            monthly_trend=monthly_trend,
            budget_recommendations=budget_recommendations,
            insights=insights,
            alerts=alerts,
        )

    def _analyze_spending_pattern(self, transactions: List[Dict]) -> SpendingPattern:
        """Analyze spending pattern from transaction history"""
        if len(transactions) < 7:
            return SpendingPattern.STABLE
        weekly_spending = defaultdict(Decimal)
        for transaction in transactions:
            date = datetime.fromisoformat(transaction["timestamp"]).date()
            week = date.isocalendar()[1]
            weekly_spending[week] += Decimal(str(transaction["amount"]))
        weekly_amounts = list(weekly_spending.values())
        if len(weekly_amounts) < 2:
            return SpendingPattern.STABLE
        mean_spending = statistics.mean(weekly_amounts)
        std_spending = statistics.stdev(weekly_amounts)
        if mean_spending == 0:
            return SpendingPattern.STABLE
        cv = float(std_spending / mean_spending)
        if cv > 0.5:
            return SpendingPattern.VOLATILE
        weeks = sorted(weekly_spending.keys())
        if len(weeks) >= 3:
            first_half = statistics.mean(
                [weekly_spending[w] for w in weeks[: len(weeks) // 2]]
            )
            second_half = statistics.mean(
                [weekly_spending[w] for w in weeks[len(weeks) // 2 :]]
            )
            change_ratio = (
                float((second_half - first_half) / first_half) if first_half > 0 else 0
            )
            if change_ratio > 0.2:
                return SpendingPattern.INCREASING
            elif change_ratio < -0.2:
                return SpendingPattern.DECREASING
        return SpendingPattern.REGULAR

    def _calculate_monthly_trend(self, transactions: List[Dict]) -> float:
        """Calculate monthly spending trend"""
        if len(transactions) < 14:
            return 0.0
        mid_point = len(transactions) // 2
        first_half = transactions[:mid_point]
        second_half = transactions[mid_point:]
        first_half_total = sum((Decimal(str(t["amount"])) for t in first_half))
        second_half_total = sum((Decimal(str(t["amount"])) for t in second_half))
        if first_half_total == 0:
            return 0.0
        trend = float((second_half_total - first_half_total) / first_half_total * 100)
        return round(trend, 2)

    def _generate_budget_recommendations(
        self, category_breakdown: Dict[str, Decimal], total_spending: Decimal
    ) -> Dict[str, Decimal]:
        """Generate AI-powered budget recommendations"""
        recommendations = {}
        standard_allocations = {
            "groceries": 0.15,
            "restaurants": 0.1,
            "transportation": 0.15,
            "entertainment": 0.05,
            "retail_shopping": 0.1,
            "utilities": 0.1,
            "healthcare": 0.05,
        }
        for category, percentage in standard_allocations.items():
            recommended_amount = total_spending * Decimal(str(percentage))
            current_amount = category_breakdown.get(category, Decimal("0"))
            if current_amount > recommended_amount * Decimal("1.5"):
                recommendations[category] = recommended_amount
            elif current_amount < recommended_amount * Decimal("0.5"):
                recommendations[category] = min(
                    recommended_amount, current_amount * Decimal("1.2")
                )
            else:
                recommendations[category] = current_amount
        return recommendations

    def _generate_spending_insights(
        self,
        category_breakdown: Dict[str, Decimal],
        total_spending: Decimal,
        pattern: SpendingPattern,
    ) -> List[str]:
        """Generate AI insights about spending patterns"""
        insights = []
        sorted_categories = sorted(
            category_breakdown.items(), key=lambda x: x[1], reverse=True
        )
        if sorted_categories:
            top_category, top_amount = sorted_categories[0]
            percentage = (
                float(top_amount / total_spending * 100) if total_spending > 0 else 0
            )
            insights.append(
                f"Your highest spending category is {top_category} at {percentage:.1f}% of total spending"
            )
        if pattern == SpendingPattern.INCREASING:
            insights.append(
                "Your spending has been increasing over the analysis period"
            )
        elif pattern == SpendingPattern.DECREASING:
            insights.append(
                "Your spending has been decreasing over the analysis period"
            )
        elif pattern == SpendingPattern.VOLATILE:
            insights.append(
                "Your spending pattern shows high variability - consider budgeting for consistency"
            )
        restaurant_spending = category_breakdown.get("restaurants", Decimal("0"))
        grocery_spending = category_breakdown.get("groceries", Decimal("0"))
        if restaurant_spending > grocery_spending and grocery_spending > 0:
            ratio = float(restaurant_spending / grocery_spending)
            insights.append(
                f"You spend {ratio:.1f}x more on restaurants than groceries - consider cooking more at home"
            )
        return insights

    def _generate_spending_alerts(
        self,
        category_breakdown: Dict[str, Decimal],
        total_spending: Decimal,
        monthly_trend: float,
    ) -> List[str]:
        """Generate spending alerts based on AI analysis"""
        alerts = []
        if total_spending > Decimal("5000"):
            alerts.append(
                "High spending detected - review your expenses for this period"
            )
        if monthly_trend > 50:
            alerts.append(
                f"Spending increased by {monthly_trend:.1f}% - monitor your budget closely"
            )
        elif monthly_trend < -30:
            alerts.append(
                f"Spending decreased by {abs(monthly_trend):.1f}% - good job on saving!"
            )
        restaurant_spending = category_breakdown.get("restaurants", Decimal("0"))
        if restaurant_spending > total_spending * Decimal("0.25"):
            alerts.append(
                "Restaurant spending is over 25% of total - consider reducing dining out"
            )
        entertainment_spending = category_breakdown.get("entertainment", Decimal("0"))
        if entertainment_spending > total_spending * Decimal("0.15"):
            alerts.append(
                "Entertainment spending is high - review subscription services and activities"
            )
        return alerts

    def update_user_profile(
        self,
        user_id: str,
        transaction_data: Dict[str, Any],
        category: TransactionCategory,
    ) -> Any:
        """Update user profile with new transaction data"""
        if user_id not in self.user_profiles:
            self.user_profiles[user_id] = {}
        category_key = category.value
        if category_key not in self.user_profiles[user_id]:
            self.user_profiles[user_id][category_key] = []
        transaction_record = {
            "amount": float(transaction_data.get("amount", 0)),
            "merchant_name": transaction_data.get("merchant_name", ""),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "category": category.value,
        }
        self.user_profiles[user_id][category_key].append(transaction_record)
        if len(self.user_profiles[user_id][category_key]) > 100:
            self.user_profiles[user_id][category_key] = self.user_profiles[user_id][
                category_key
            ][-100:]


ai_categorizer = AITransactionCategorizer()

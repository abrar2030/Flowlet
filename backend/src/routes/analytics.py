"""
Financial Analytics Routes
"""

from flask import Blueprint, request, jsonify, g
from sqlalchemy import select, func, and_, or_
from datetime import datetime, timezone, timedelta
from decimal import Decimal
import logging

# Import refactored modules
from ..models.database import db
from ..models.user import User
from ..models.account import Account
from ..models.transaction import Transaction, TransactionType
from ..models.card import Card
from .auth import token_required  # Assuming decorators are defined here for now

# Create blueprint
analytics_bp = Blueprint("analytics", __name__, url_prefix="/api/v1/analytics")

# Configure logging
logger = logging.getLogger(__name__)


def _get_date_range(period: str) -> datetime:
    """Helper to calculate the start date based on the period string."""
    now = datetime.now(timezone.utc)
    if period == "7d":
        return now - timedelta(days=7)
    elif period == "30d":
        return now - timedelta(days=30)
    elif period == "90d":
        return now - timedelta(days=90)
    elif period == "1y":
        return now - timedelta(days=365)
    else:
        return now - timedelta(days=30)


@analytics_bp.route("/dashboard", methods=["GET"])
@token_required
def get_dashboard_analytics():
    """Get dashboard analytics for the current user"""
    try:
        user_id = g.current_user.id

        # Get user's accounts
        accounts_stmt = select(Account).filter_by(user_id=user_id)
        accounts = db.session.execute(accounts_stmt).scalars().all()
        account_ids = [account.id for account in accounts]

        # Calculate total balance across all accounts
        total_balance = sum(account.balance for account in accounts)

        # Get recent transactions (last 30 days)
        thirty_days_ago = _get_date_range("30d")

        recent_transactions_stmt = (
            select(Transaction)
            .filter(
                Transaction.account_id.in_(account_ids),
                Transaction.created_at >= thirty_days_ago,
            )
            .order_by(Transaction.created_at.desc())
            .limit(10)
        )

        recent_transactions = (
            db.session.execute(recent_transactions_stmt).scalars().all()
        )

        # Calculate spending this month
        current_month_start = datetime.now(timezone.utc).replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )

        monthly_spending_stmt = select(func.sum(Transaction.amount)).filter(
            Transaction.account_id.in_(account_ids),
            Transaction.transaction_type == TransactionType.DEBIT,
            Transaction.created_at >= current_month_start,
        )
        monthly_spending = db.session.execute(
            monthly_spending_stmt
        ).scalar_one_or_none() or Decimal("0.00")

        # Get cards count
        total_cards_stmt = (
            select(func.count())
            .select_from(Card)
            .filter(Card.account_id.in_(account_ids))
        )
        total_cards = db.session.execute(total_cards_stmt).scalar_one()

        active_cards_stmt = (
            select(func.count())
            .select_from(Card)
            .filter(Card.account_id.in_(account_ids), Card.status == "active")
        )
        active_cards = db.session.execute(active_cards_stmt).scalar_one()

        # Format recent transactions
        transaction_list = [t.to_dict() for t in recent_transactions]

        return (
            jsonify(
                {
                    "user_id": user_id,
                    "summary": {
                        "total_balance": float(total_balance),
                        "monthly_spending": float(monthly_spending),
                        "total_accounts": len(accounts),
                        "total_cards": total_cards,
                        "active_cards": active_cards,
                    },
                    "recent_transactions": transaction_list,
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Get dashboard analytics error: {str(e)}", exc_info=True)
        return (
            jsonify({"error": "Internal server error", "code": "INTERNAL_ERROR"}),
            500,
        )


@analytics_bp.route("/spending", methods=["GET"])
@token_required
def get_spending_analytics():
    """Get spending analytics for the current user"""
    try:
        user_id = g.current_user.id
        period = request.args.get("period", "30d")
        start_date = _get_date_range(period)

        # Get user's accounts
        accounts_stmt = select(Account.id).filter_by(user_id=user_id)
        account_ids = db.session.execute(accounts_stmt).scalars().all()

        # Get spending transactions (Debit transactions)
        spending_transactions_stmt = select(Transaction).filter(
            Transaction.account_id.in_(account_ids),
            Transaction.transaction_type == TransactionType.DEBIT,
            Transaction.created_at >= start_date,
        )
        spending_transactions = (
            db.session.execute(spending_transactions_stmt).scalars().all()
        )

        # Calculate daily spending and category spending
        daily_spending = {}
        category_spending = {}

        for transaction in spending_transactions:
            date_key = transaction.created_at.date().isoformat()

            # Daily spending
            if date_key not in daily_spending:
                daily_spending[date_key] = Decimal("0.00")
            daily_spending[date_key] += transaction.amount

            # Category spending
            category = transaction.transaction_category.value
            if category not in category_spending:
                category_spending[category] = Decimal("0.00")
            category_spending[category] += transaction.amount

        # Convert to list format for charts
        daily_data = [
            {"date": date, "amount": float(amount)}
            for date, amount in sorted(daily_spending.items())
        ]
        category_data = [
            {"category": category, "amount": float(amount)}
            for category, amount in category_spending.items()
        ]

        total_spending = sum(category_spending.values())

        return (
            jsonify(
                {
                    "user_id": user_id,
                    "period": period,
                    "total_spending": float(total_spending),
                    "daily_spending": daily_data,
                    "category_breakdown": category_data,
                    "transaction_count": len(spending_transactions),
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Get spending analytics error: {str(e)}", exc_info=True)
        return (
            jsonify({"error": "Internal server error", "code": "INTERNAL_ERROR"}),
            500,
        )


@analytics_bp.route("/income", methods=["GET"])
@token_required
def get_income_analytics():
    """Get income analytics for the current user"""
    try:
        user_id = g.current_user.id
        period = request.args.get("period", "30d")
        start_date = _get_date_range(period)

        # Get user's accounts
        accounts_stmt = select(Account.id).filter_by(user_id=user_id)
        account_ids = db.session.execute(accounts_stmt).scalars().all()

        # Get income transactions (Credit transactions)
        income_transactions_stmt = select(Transaction).filter(
            Transaction.account_id.in_(account_ids),
            Transaction.transaction_type == TransactionType.CREDIT,
            Transaction.created_at >= start_date,
        )
        income_transactions = (
            db.session.execute(income_transactions_stmt).scalars().all()
        )

        # Calculate daily income and source income
        daily_income = {}
        source_income = {}

        for transaction in income_transactions:
            date_key = transaction.created_at.date().isoformat()

            # Daily income
            if date_key not in daily_income:
                daily_income[date_key] = Decimal("0.00")
            daily_income[date_key] += transaction.amount

            # Source income (using transaction category)
            source = transaction.transaction_category.value
            if source not in source_income:
                source_income[source] = Decimal("0.00")
            source_income[source] += transaction.amount

        # Convert to list format
        daily_data = [
            {"date": date, "amount": float(amount)}
            for date, amount in sorted(daily_income.items())
        ]
        source_data = [
            {"source": source, "amount": float(amount)}
            for source, amount in source_income.items()
        ]

        total_income = sum(source_income.values())

        return (
            jsonify(
                {
                    "user_id": user_id,
                    "period": period,
                    "total_income": float(total_income),
                    "daily_income": daily_data,
                    "source_breakdown": source_data,
                    "transaction_count": len(income_transactions),
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Get income analytics error: {str(e)}", exc_info=True)
        return (
            jsonify({"error": "Internal server error", "code": "INTERNAL_ERROR"}),
            500,
        )


@analytics_bp.route("/balance-history", methods=["GET"])
@token_required
def get_balance_history():
    """Get balance history for the current user (simplified simulation)"""
    try:
        user_id = g.current_user.id
        period = request.args.get("period", "30d")
        start_date = _get_date_range(period)

        # Get user's accounts
        accounts_stmt = select(Account).filter_by(user_id=user_id)
        accounts = db.session.execute(accounts_stmt).scalars().all()

        # For simplicity, we will only track the total balance of the primary account (if exists)
        # In a real system, this would involve querying a dedicated balance snapshot table.
        if not accounts:
            return jsonify({"current_balance": 0.0, "balance_history": []}), 200

        primary_account = accounts[0]
        current_balance = primary_account.balance

        # Simulate balance history based on transactions (expensive, but necessary without snapshot table)
        # This is a highly simplified and inefficient simulation for demonstration.

        # Get all transactions for the primary account within the period
        transactions_stmt = (
            select(Transaction)
            .filter(
                Transaction.account_id == primary_account.id,
                Transaction.created_at >= start_date,
            )
            .order_by(Transaction.created_at.asc())
        )
        transactions = db.session.execute(transactions_stmt).scalars().all()

        # Calculate starting balance (current balance - sum of all transactions in period)
        total_change = sum(
            t.amount if t.transaction_type == TransactionType.CREDIT else -t.amount
            for t in transactions
        )
        starting_balance = current_balance - total_change

        balance_history = []
        running_balance = starting_balance

        # Add starting point
        balance_history.append(
            {"date": start_date.date().isoformat(), "balance": float(running_balance)}
        )

        # Replay transactions
        for transaction in transactions:
            if transaction.transaction_type == TransactionType.CREDIT:
                running_balance += transaction.amount
            else:
                running_balance -= transaction.amount

            balance_history.append(
                {
                    "date": transaction.created_at.date().isoformat(),
                    "balance": float(running_balance),
                }
            )

        # Remove duplicates by date, keeping the latest balance for each day
        final_history = {}
        for item in balance_history:
            final_history[item["date"]] = item["balance"]

        final_history_list = [
            {"date": date, "balance": balance}
            for date, balance in sorted(final_history.items())
        ]

        return (
            jsonify(
                {
                    "user_id": user_id,
                    "period": period,
                    "current_balance": float(current_balance),
                    "balance_history": final_history_list,
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Get balance history error: {str(e)}", exc_info=True)
        return (
            jsonify({"error": "Internal server error", "code": "INTERNAL_ERROR"}),
            500,
        )

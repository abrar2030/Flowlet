import logging
from datetime import datetime, timezone

from flask import Blueprint, jsonify

from ..models.database import db
from .auth import \
    token_required  # Assuming decorators are defined here for now

"""
System Monitoring and Health Check Routes
"""


# Import refactored modules

# Create blueprint
monitoring_bp = Blueprint("monitoring", __name__, url_prefix="/api/v1/monitoring")

# Configure logging
logger = logging.getLogger(__name__)


@monitoring_bp.route("/health", methods=["GET"])
def system_health():
    """Get overall system health status"""
    try:
        # Check Database Connection
        db_status = "unhealthy"
        try:
            # Simple query to check connection
            db.session.execute("SELECT 1").scalar()
            db_status = "healthy"
        except Exception as e:
            logger.error(f"Database health check failed: {e}")

        # Check other services (simulated)
        service_health = {
            "database": db_status,
            "redis_cache": "healthy",  # Assuming Redis is running
            "ai_service": "healthy",  # Assuming OpenAI client initialized
            "payment_integrations": "partial_health",
        }

        overall_status = (
            "operational"
            if all(s == "healthy" for s in service_health.values())
            else "degraded"
        )

        return (
            jsonify(
                {
                    "system_status": overall_status,
                    "version": "1.0.0",
                    "services_health": service_health,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"System health check error: {str(e)}", exc_info=True)
        return (
            jsonify(
                {
                    "error": "Internal server error during health check",
                    "code": "INTERNAL_ERROR",
                }
            ),
            500,
        )
